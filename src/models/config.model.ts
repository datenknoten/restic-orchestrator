/**
 * Third party imports
 */
import * as path from 'path';
import * as fse from 'fs-extra';
const appDirectory = require('appdirectory');

import {
    IsString,
    IsOptional,
    IsBoolean,
    validate,
} from 'class-validator';

/**
 * Own imports
 */
import {ConfigInterface, EnvironmentInterface} from '../interfaces';
import {
    ConfigFileEmptyError,
    ConfigFileInvalidError,
    ConfigFileNotFoundError,
} from '../errors';

/**
 * A model of a configuration
 */
export class ConfigModel implements ConfigInterface {
    /**
     * Password for the backup encryption
     */
    @IsString()
    backupPassword: string;
    /**
     * Where the backup is stored
     */
    @IsString()
    repository: string;
    /**
     * What should be backuped
     */
    @IsString({
        each: true,
    })
    files: string[];
    /**
     * Exclude files
     */
    @IsString({
        each: true,
    })
    @IsOptional()
    exclude?: string[];
    /**
     * Additional env vars, for cloud storage for example
     */
    @IsOptional()
    env?: EnvironmentInterface;
    /**
     * The user to SSH into the host
     */
    @IsString()
    @IsOptional()
    user?: string;
    /**
     * If we need to prepend sudo to the command
     */
    @IsBoolean()
    @IsOptional()
    needsSudo?: boolean;
    /**
     * The host to SSH into
     */
    @IsString()
    host: string;
    /**
     * Execute a command before the backup is executed, f.e. run a database dump
     */
    @IsString()
    @IsOptional()
    preCommand?: string;
    /**
     * Execute a command after the backup is finished
     */
    @IsString()
    @IsOptional()
    postCommand?: string;

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

        const returnValue: ConfigModel[] = [];

        try {
            config = JSON.parse(configFile);
            if (!Array.isArray(config)) {
                const error = new ConfigFileInvalidError();
                error.reason = 'Config is not an Array';
                throw error;
            }

            for (const item of config) {
                const configItem = ConfigModel.serializeFromJson(item);

                const validationErrors = await validate(configItem);

                if (validationErrors.length > 0) {
                    const error = new ConfigFileInvalidError();
                    error.reason = validationErrors;
                    throw error;
                }

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
