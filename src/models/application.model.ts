/** Third Party imports */
import * as winston from 'winston';
import * as path from 'path';
import _caporal from 'caporal';
const appDirectory = require('appdirectory');

/** Own Code */
import {
    ConfigFileNotFoundError,
    ConfigFileEmptyError,
    ConfigFileInvalidError,
    ReturnCodes,
} from '../errors';

import {
    ConfigModel,
    HostModel,
} from '../models';

import {
    ExecutorHelper,
} from '../helpers';

/** Caporal typing setup */
type caporalClass = typeof _caporal;
const caporal: caporalClass = require('caporal');

interface ArgType {
    // tslint:disable-next-line:no-any
    [key: string]: any;
}

/**
 * The central application model
 */
export class ApplicationModel {
    /**
     * The internal reference to the logger
     */
    private logger: winston.LoggerInstance;

    /**
     * Return a logger
     */
    public getLogger(): winston.LoggerInstance {
        return this.logger;
    }

    constructor() {
        this.logger = winston.cli();
        this.logger.level = 'info';
        ExecutorHelper.application = this;
    }

    /**
     * Parses the supplied arguments and returns them
     */
    public async getArgs(): Promise<ArgType> {
        return new Promise<ArgType>((resolve) => {
            const dirs = new appDirectory({
                appName: 'restic-orchestrator',
                appAuthor: 'datenknoten',
                useRoaming: true,
            });
            caporal
                .version('1.0.0')
                .description('an orchestrator for restic backups on multiple hosts')
                .argument('command', 'Run specific command. Allowed values are: init, backup', ['init', 'backup'], 'backup')
                .option('--dry-run', 'Do not run restic, just print the command')
                .option('--config', `Specify another config file. Default is ${path.join(dirs.userData(), 'config.json')}`)
                .option('--verbose', 'Set the logger to debug')
                .action((args, options, _logger) => {
                    args.dryRun = !!options.dryRun;
                    args.verbose = !!options.verbose;
                    resolve(args);
                });

            caporal.parse(process.argv);
        });
    }

    /**
     * Run the application
     */
    public async run() {
        try {
            const args = await this.getArgs();
            if (args) {
                if (args.verbose) {
                    this.logger.level = 'debug';
                }
            }
            const config = await ConfigModel.getConfig(args.config);
            if (config.length > 0) {
                for (const item of config) {
                    const host = new HostModel(item, this);
                    if (args.command === 'backup') {
                        await host.preRun();
                        await host.run();
                        await host.postRun();
                    } else if (args.command === 'init') {
                        await host.init();
                    }
                }
            }
            process.exit(ReturnCodes.Success);
        } catch (error) {
            if (error instanceof ConfigFileNotFoundError) {
                this.getLogger().error('Could not find a valid logfile');
                process.exit(ReturnCodes.ConfigFileNotFound);
            } else if (error instanceof ConfigFileEmptyError) {
                this.getLogger().error('Config file is empty');
                process.exit(ReturnCodes.ConfigFileEmpty);
            } else if (error instanceof ConfigFileInvalidError) {
                this.getLogger().error('Config file did not pass validation', {
                    reason: error.reason,
                });
                process.exit(ReturnCodes.ConfigFileInvalid);
            } else {
                let _error;
                if (typeof error === 'string') {
                    _error = error;
                } else {
                    _error = {
                        stack: error.stack,
                        name: error.name,
                        message: error.message,
                        constr: error.constructor.name,
                    };
                }
                this.getLogger().error('An uncatched error happened ☹', {
                    error: _error,
                });
                process.exit(ReturnCodes.GenericError);
            }
        }
    }
}
