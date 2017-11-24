/**
 * Third party imports
 */
import * as TJS from 'typescript-json-schema';
import * as path from 'path';
import * as fse from 'fs-extra';
const appDirectory = require('appdirectory');
import * as Ajv from 'ajv';


/**
 * Own imports
 */
import {ConfigInterface} from '../interfaces';
import {
    InvalidJSONSchemaError,
    ConfigFileEmptyError,
    ConfigFileInvalidError,
    ConfigFileNotFoundError,
} from '../errors';

/**
 * A model of a configuration
 */
export class ConfigModel implements ConfigInterface {
    /**
     * The user to SSH into the host
     */
    user?: string;
    /**
     * If we need to prepend sudo to the command
     */
    needsSudo?: boolean;
    /**
     * The host to SSH into
     */
    host: string;
    /**
     * Execute a command before the backup is executed, f.e. run a database dump
     */
    preCommand?: string;
    /**
     * Execute a command after the backup is finished
     */
    postCommand?: string;

    /**
     * Returns the config schema
     */
    public static getConfigSchema (): any {
        const settings: TJS.PartialArgs = {
            required: true,
        };

        const compilerOptions: TJS.CompilerOptions = {
            strictNullChecks: true,
        };

        const program = TJS.getProgramFromFiles([path.resolve(__dirname, '..', 'interfaces', 'config.interface.ts')], compilerOptions);

        const schema = TJS.generateSchema(program, 'ConfigInterface', settings);

        if (schema) {
            return schema;
        } else {
            throw new InvalidJSONSchemaError();
        }
    }

    /**
 * Loads the config from configuration file and returns it
 */
    public static async getConfig (configFilePath?: string): Promise<ConfigModel[]> {
        if (!configFilePath) {
            const dirs = new appDirectory({
                appName: 'restic-orchestrator',
                appAuthor: 'datenknoten',
                useRoaming: true,
            });
            configFilePath = path.join(dirs.userData(), 'config.json');
        }
        if (!(await fse.pathExists(configFilePath))) {
            throw new ConfigFileNotFoundError();
        }
        const configFile = await fse.readFile(configFilePath, 'utf-8');

        if (configFile.length === 0) {
            throw new ConfigFileEmptyError();
        }

        let config: ConfigInterface[] = [];

        const configSchema = ConfigModel.getConfigSchema();

        delete configSchema['$schema'];

        const returnValue: ConfigModel[] = [];

        try {
            config = JSON.parse(configFile);
            if (!Array.isArray(config)) {
                const error = new ConfigFileInvalidError();
                error.reason = 'Config is not an Array';
                throw error;
            }
            const ajv = new Ajv();
            for (const item of config) {
                const isValid = ajv.validate(configSchema, item);
                if (!isValid) {
                    const error = new ConfigFileInvalidError();
                    if (ajv.errors) {
                        error.reason = ajv.errors;
                    }
                    console.dir(ajv.errors);
                    throw error;
                }
                const configItem = new ConfigModel();
                configItem.host = item.host;
                configItem.needsSudo = item.needsSudo;
                configItem.postCommand = item.postCommand;
                configItem.preCommand = item.preCommand;
                configItem.user = item.user;
                returnValue.push(configItem);
            }
        } catch (e) {
            if (e instanceof ConfigFileInvalidError) {
                throw e;
            } else if (e instanceof SyntaxError) {
                const error = new ConfigFileInvalidError();
                error.reason = e.message;
                throw error;
            } else {
                console.dir(e);
                throw new ConfigFileInvalidError();
            }
        }

        return returnValue;
    }
}
