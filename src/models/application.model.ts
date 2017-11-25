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
     * Return a logger
     */
    public getLogger(): winston.LoggerInstance {
        const logger = winston.cli();
        logger.level = 'info';

        return logger;
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
                .argument('[type]', 'The type of backup, full or incremental', ['full', 'incr', 'incremental'], 'incr')
                .option('--dry-run', 'Do not run restic, just print the command')
                .option('--config', `Specify another config file. Default is ${path.join(dirs.userData(), 'config.json')}`)
                .action((args, options, _logger) => {
                    args.dryRun = !!options.dryRun;
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
            if (args && args.type && args.type === 'incr') {
                args.type = 'incremental';
            }
            const config = await ConfigModel.getConfig(args.config);
            if (config.length > 0) {
                for (const item of config) {
                    const host = new HostModel(item, this);
                    await host.preRun();
                    await host.run();
                    await host.postRun();
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
                this.getLogger().error('An uncatched error happened ☹', {
                    error: (error.stack ? error.stack : error),
                });
                process.exit(ReturnCodes.GenericError);
            }
        }
    }
}