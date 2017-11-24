
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
    ReturnCodes,
} from './errors';

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

/** appdirectory config */
const dirs = new appDirectory({
    appName: 'restic-orchestrator',
    appAuthor: 'datenknoten',
    useRoaming: true,
});

/**
 * Parses the supplied arguments and returns them
 */
async function getArgs (): Promise<ArgType> {
    return new Promise<ArgType>((resolve) => {
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
 * Loads the config from configuration file and returns it
 */
async function getConfig (configFile?: string): Promise<ConfigInterface[]> {
    if (!configFile) {
        configFile = path.join(dirs.userData(), 'config.json');
    }
    if (!(await fse.pathExists(configFile))) {
        throw new ConfigFileNotFoundError();
    }
    console.dir(dirs.userData());
    return [];
}

// tslint:disable-next-line:no-floating-promises
(async () => {
    try {
        const args = await getArgs();
        if (args && args.type && args.type === 'incr') {
            args.type = 'incremental';
        }
        const config = await getConfig(args.config);
        console.dir(config);
        process.exit(ReturnCodes.Success);
    } catch (error) {
        if (error instanceof ConfigFileNotFoundError) {
            logger.error('Could not find a valid logfile');
            process.exit(ReturnCodes.ConfigFileNotFound);
        } else {
            logger.error('An uncatched error happened ☹', {
                error: (error.stack ? error.stack : error),
            });
            process.exit(ReturnCodes.GenericError);
        }
    }
})();
