import {
    EnvironmentInterface,
    ExecutorResultInterface,
} from '../interfaces';
import * as shell from 'shelljs';

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
        return new Promise<ExecutorResultInterface>((resolve) => {
            shell.exec(command, {
                async: true,
                silent: true,
                shell: '/bin/bash',
            }, (code: number, stdout: string, stderr: string) => {
                resolve({
                    returnCode: code,
                    stdout,
                    stderr,
                });
            });
        });
    }
}
