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
import {ConfigInterface, EnvironmentInterface} from '../interfaces';
import {
    InvalidJSONSchemaError,
    ConfigFileEmptyError,
    ConfigFileInvalidError,
    ConfigFileNotFoundError,
    JSONSchemaNotFoundError,
} from '../errors';

/**
 * A model of a configuration
 */
export class ConfigModel implements ConfigInterface {
    /**
     * Password for the backup encryption
     */
    backupPassword: string;
    /**
     * Where the backup is stored
     */
    repository: string;
    /**
     * What should be backuped
     */
    files: string[];
    /**
     * Exclude files
     */
    exclude?: string[];
    /**
     * Additional env vars, for cloud storage for example
     */
    env?: EnvironmentInterface;
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
    // tslint:disable-next-line:no-any
    public static async getConfigSchema(): Promise<any> {
        const interfaceFile = path.resolve(__dirname, '..', 'interfaces', 'config.interface.ts');
        if (await fse.pathExists(interfaceFile)) {
            const settings: TJS.PartialArgs = {
                required: true,
            };

            const compilerOptions: TJS.CompilerOptions = {
                strictNullChecks: true,
            };

            const program = TJS.getProgramFromFiles([interfaceFile], compilerOptions);

            const schema = TJS.generateSchema(program, 'ConfigInterface', settings);

            if (schema) {
                return schema;
            } else {
                throw new InvalidJSONSchemaError();
            }
        } else {
            const schemaFile = path.resolve(__dirname, '..', 'schema', 'config.schema.json');
            if (await fse.pathExists(schemaFile)) {
                const schemaContent = await fse.readFile(schemaFile, 'utf-8');
                const schema = JSON.parse(schemaContent);
                return schema;
            } else {
                throw new JSONSchemaNotFoundError();
            }
        }
    }

    /**
     * Create a ConfigModel from JSON-data
     */
    // tslint:disable-next-line:no-any
    private static serializeFromJson(item: any): ConfigModel {
        const configItem = new ConfigModel();
        configItem.user = item.user;
        configItem.needsSudo = item.needsSudo;
        configItem.host = item.host;

        configItem.backupPassword = item.backupPassword;
        configItem.repository = item.repository;
        configItem.files = item.files;
        configItem.exclude = item.exclude;
        configItem.env = item.env;

        configItem.preCommand = item.preCommand;
        configItem.postCommand = item.postCommand;

        return configItem;
    }

    /**
     * Returns the default file path for the config file
     */
    private static get defaultConfigFilePath(): string {
        const dirs = new appDirectory({
            appName: 'restic-orchestrator',
            appAuthor: 'datenknoten',
            useRoaming: true,
        });
        return path.join(dirs.userData(), 'config.json');
    }

    /**
     * Loads the config from configuration file and returns it
     */
    public static async getConfig(configFilePath?: string): Promise<ConfigModel[]> {
        if (!configFilePath) {
            configFilePath = ConfigModel.defaultConfigFilePath;
        }

        if (!(await fse.pathExists(configFilePath))) {
            throw new ConfigFileNotFoundError();
        }

        const configFile = await fse.readFile(configFilePath, 'utf-8');

        if (configFile.length === 0) {
            throw new ConfigFileEmptyError();
        }

        let config: ConfigInterface[] = [];

        const configSchema = await ConfigModel.getConfigSchema();

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
                    throw error;
                }
                const configItem = ConfigModel.serializeFromJson(item);

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
                throw new ConfigFileInvalidError();
            }
        }

        return returnValue;
    }
}
