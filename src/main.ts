
/** Third Party imports */
import * as fse from 'fs-extra';
import * as winston from 'winston';
import * as path from 'path';
import _caporal from 'caporal';
const appDirectory = require('appdirectory');



/** Own Code */
import {ConfigInterface} from './interfaces';
import {
    ConfigFileNotFoundError,
    ConfigFileEmptyError,
    ConfigFileInvalidError,
    InvalidJSONSchemaError,
    ReturnCodes,
} from './errors';

import { ConfigModel } from './models';

/** Caporal typing setup */
type caporalClass = typeof _caporal;
const caporal: caporalClass = require('caporal');

interface ArgType {
    // tslint:disable-next-line:no-any
    [key: string]: any;
}


/** winston setup */
const logger = winston.cli();
logger.level = 'info';


/**
 * Parses the supplied arguments and returns them
 */
async function getArgs (): Promise<ArgType> {
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

// tslint:disable-next-line:no-floating-promises
(async () => {
    try {
        const args = await getArgs();
        if (args && args.type && args.type === 'incr') {
            args.type = 'incremental';
        }
        const config = await ConfigModel.getConfig(args.config);
        console.dir(config);
        process.exit(ReturnCodes.Success);
    } catch (error) {
        if (error instanceof ConfigFileNotFoundError) {
            logger.error('Could not find a valid logfile');
            process.exit(ReturnCodes.ConfigFileNotFound);
        } else if (error instanceof ConfigFileEmptyError) {
            logger.error('Config file is empty');
            process.exit(ReturnCodes.ConfigFileEmpty);
        } else if (error instanceof ConfigFileInvalidError) {
            logger.error('Config file did not pass validation', {
                reason: error.reason,
            });
            process.exit(ReturnCodes.ConfigFileInvalid);
        } else {
            logger.error('An uncatched error happened ☹', {
                error: (error.stack ? error.stack : error),
            });
            process.exit(ReturnCodes.GenericError);
        }
    }
})();
