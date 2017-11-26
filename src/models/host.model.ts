import {
    ConfigModel,
    ApplicationModel,
} from '../models';

import {
    ExecutorHelper,
} from '../helpers';

/**
 * A representation of a host
 */
export class HostModel {
    /**
     * The config of the host
     */
    public config: ConfigModel;
    /**
     * The central application
     */
    public application: ApplicationModel;
    constructor(
        config: ConfigModel,
        application: ApplicationModel,
    ) {
        this.config = config;
        this.application = application;
    }

    /**
     * Runs the command before the backup
     */
    public async preRun() {
        if (this.config.preCommand) {
            await ExecutorHelper.run(
                this.config.host,
                this.config.preCommand,
                this.config.user,
                this.config.needsSudo,
                this.config.env,
            );
        }
    }

    /**
     * Runs the backup
     */
    public async run() {
        await ExecutorHelper.run(
            this.config.host,
            `/usr/bin/install -m 600 /dev/null /tmp/backup-password && echo ${this.config.backupPassword} >> /tmp/backup-password`,
            this.config.user,
        );

        const command: string[] = [
            '/usr/local/bin/restic',
            `--password-file /tmp/backup-password`,
            `--repository ${this.config.repository}`,
            'backup',
        ];
        if (this.config.exclude && (this.config.exclude.length > 0)) {
            for (const item of this.config.exclude) {
                command.push(`--exclude ${item}`);
            }
        }
        for (const item of this.config.files) {
            command.push(item);
        }
        await ExecutorHelper.run(
            this.config.host,
            command.join(' '),
            this.config.user,
            this.config.needsSudo,
            this.config.env,
        );

        await ExecutorHelper.run(
            this.config.host,
            `rm /tmp/backup-password`,
            this.config.user,
        );
    }

    /**
     * Runs the command after the backup
     */
    public async postRun() {
        if (this.config.postCommand) {
            await ExecutorHelper.run(
                this.config.host,
                this.config.postCommand,
                this.config.user,
                this.config.needsSudo,
                this.config.env,
            );
        }
    }


}
