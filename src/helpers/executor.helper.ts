import {
    EnvironmentInterface,
    ExecutorResultInterface,
} from '../interfaces';
import {exec as _exec} from 'child_process';
import * as util from 'util';

const exec = util.promisify(_exec);

/**
 * The class that runs the actual remote commands
 */
export abstract class ExecutorHelper {
    /**
     * Run a command on a remote host
     */
    public static async run(
        host: string,
        command: string,
        user?: string,
        needsSudo?: boolean,
        env?: EnvironmentInterface,
    ) {
        const commandParts: string[] = ['ssh'];
        if (user) {
            commandParts.push(`-l ${user}`);
        }
        commandParts.push(host);
        commandParts.push('"');
        if (env && (Object.keys(env).length > 0)) {
            for (const key of Object.keys(env)) {
                commandParts.push(`${key}=${env[key]}`);
            }
        }
        if (needsSudo) {
            commandParts.push('/usr/bin/sudo -E');
        }
        commandParts.push(command);

        commandParts.push('"');

        const executeCommand = commandParts.join(' ');
        return ExecutorHelper._run(executeCommand);
    }

    /**
     * The internal command runner
     */
    private static async _run(command: string): Promise<ExecutorResultInterface> {
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

        return returnValue;
    }
}
