import {
    ExecutorResultInterface,
} from '../interfaces';
import {ApplicationModel} from '../models';
import {CommandBuilder} from '../helpers';
import {exec as _exec} from 'child_process';
import * as util from 'util';

const exec = util.promisify(_exec);

/**
 * The class that runs the actual remote commands
 */
export abstract class ExecutorHelper {
    /**
     * The core application
     */
    public static application: ApplicationModel;
    /**
     * Run a command on a remote host
     */
    public static async run(
        host: string,
        command: string,
        user?: string,
    ) {
        const ssh = new CommandBuilder();
        ssh.command = 'ssh';
        if (user) {
            ssh.options.push({
                name: '-l',
                value: user,
                useEqualSign: false,
            });
        }

        ssh.arguments.push(host);

        ssh.arguments.push(command);

        const executeCommand = ssh.render();
        return ExecutorHelper._run(executeCommand);
    }

    /**
     * The internal command runner
     */
    private static async _run(command: string): Promise<ExecutorResultInterface> {
        ExecutorHelper.application.getLogger().debug('[ExecutorHelper->_run] command', {
            command,
        });
        const returnValue: ExecutorResultInterface = {
            returnCode: 0,
            stdout: '',
            stderr: '',
        };

        try {
            const results = await exec(command);
            returnValue.stdout = results.stdout;
            returnValue.stderr = results.stderr;
        } catch (error) {
            if (error.code) {
                returnValue.returnCode = error.code;
            } else {
                returnValue.returnCode = 1;
            }
        }
        ExecutorHelper.application.getLogger().debug('[ExecutorHelper->_run] returnValue', {
            returnValue,
        });
        return returnValue;
    }
}
