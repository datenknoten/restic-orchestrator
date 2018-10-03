import {
    ConfigModel,
    ApplicationModel,
} from '../models';

import {
    ExecutorHelper,
    CommandBuilder,
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
     * Put the password file on the remote server
     */
    private async putPasswort(): Promise<void> {
        await ExecutorHelper.run(
            this.config.host,
            `/usr/bin/install -m 600 /dev/null /tmp/backup-password && echo ${this.config.backupPassword} >> /tmp/backup-password`,
            this.config.user,
        );
    }

    /**
     * Remove the remote password file
     */
    private async releasePassword(): Promise<void> {
        await ExecutorHelper.run(
            this.config.host,
            `rm /tmp/backup-password`,
            this.config.user,
        );
    }

    /**
     * Runs the backup
     */
    public async run() {
        await this.putPasswort();

        const restic = new CommandBuilder();
        restic.hasSudo = this.config.needsSudo ? true : false;
        restic.command = '/usr/local/bin/restic';
        restic.options.push({
            name: '--password-file',
            value: '/tmp/backup-password',
            useEqualSign: false,
        });
        restic.options.push({
            name: '--repo',
            value: this.config.repository,
            useEqualSign: false,
        });
        restic.arguments.push('backup');

        if (this.config.exclude && (this.config.exclude.length > 0)) {
            for (const item of this.config.exclude) {
                restic.options.push({
                    name: '--exclude',
                    value: item,
                    useEqualSign: false,
                });
            }
        }
        for (const item of this.config.files) {
            restic.arguments.push(item);
        }

        Object.assign(restic.env, this.config.env);

        await ExecutorHelper.run(
            this.config.host,
            restic.render(),
            this.config.user,
        );

        await this.releasePassword();
    }

    /**
     * run a speific hook
     */
    private async runHook(hookType: 'pre' | 'post') {
        let command: string | undefined;
        if (hookType === 'pre') {
            command = this.config.preCommand;
        } else if (hookType === 'post') {
            command = this.config.postCommand;
        }

        if (!command) {
            return;
        }

        await ExecutorHelper.run(
            this.config.host,
            command,
            this.config.user,
        );
    }

    /**
     * Runs the command before the backup
     */
    public async preRun() {
        await this.runHook('pre');
    }

    /**
     * Runs the command after the backup
     */
    public async postRun() {
        await this.runHook('post');
    }

    /**
     * Init the remote restic repository
     */
    public async init() {
        await this.putPasswort();

        const restic = new CommandBuilder();
        restic.hasSudo = this.config.needsSudo ? true : false;

        restic.command = '/usr/local/bin/restic';

        restic.options.push({
            name: '--password-file',
            value: '/tmp/backup-password',
            useEqualSign: false,
        });

        restic.options.push({
            name: '--repo',
            value: this.config.repository,
            useEqualSign: false,
        });

        restic.arguments.push('init');

        Object.assign(restic.env, this.config.env);

        await ExecutorHelper.run(
            this.config.host,
            restic.render(),
            this.config.user,
        );

        await this.releasePassword();
    }

    /**
     * clean up old backups
     */
    public async forget() {
        if (!(typeof this.config.keepLastSnapshots === 'number')) {
            return;
        }

        await this.putPasswort();

        const restic = new CommandBuilder();
        restic.hasSudo = this.config.needsSudo ? true : false;

        restic.command = '/usr/local/bin/restic';

        restic.options.push({
            name: '--password-file',
            value: '/tmp/backup-password',
            useEqualSign: false,
        });

        restic.options.push({
            name: '--repo',
            value: this.config.repository,
            useEqualSign: false,
        });

        restic.options.push({
            name: '--keep-last',
            value: this.config.keepLastSnapshots.toString(),
            useEqualSign: false,
        });

        restic.arguments.push('forget');

        Object.assign(restic.env, this.config.env);

        await ExecutorHelper.run(
            this.config.host,
            restic.render(),
            this.config.user,
        );

        await this.releasePassword();
    }

    /**
     * clean up unneeded stuff
     */
    public async cleanup() {
        await this.putPasswort();

        const restic = new CommandBuilder();
        restic.hasSudo = this.config.needsSudo ? true : false;

        restic.command = '/usr/local/bin/restic';

        restic.options.push({
            name: '--password-file',
            value: '/tmp/backup-password',
            useEqualSign: false,
        });

        restic.options.push({
            name: '--repo',
            value: this.config.repository,
            useEqualSign: false,
        });

        restic.arguments.push('prune');

        Object.assign(restic.env, this.config.env);

        await ExecutorHelper.run(
            this.config.host,
            restic.render(),
            this.config.user,
        );

        await this.releasePassword();
    }


}
