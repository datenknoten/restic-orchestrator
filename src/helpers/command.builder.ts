import {
    CommandOptionInterface,
    EnvironmentInterface,
} from '../interfaces';

/**
 * Build a command for consumption for the executor
 */
export class CommandBuilder {
    /**
     * The command that gets executed
     */
    public command: string;
    /**
     * Optional environment variables
     */
    public env: EnvironmentInterface = {};
    /**
     * Optional options for the command
     */
    public options: CommandOptionInterface[] = [];
    /**
     * Optional arguments for the command
     */
    public arguments: string[] = [];

    /**
     * Render the final command
     */
    public render(): string {
        let command = '';

        if (Object.keys(this.env).length > 0) {
            for (const key of Object.keys(this.env)) {
                command += `${key}="${this.env[key].replace(/"/g, '\\"')}" `;
            }
        }

        command += this.command;

        if (this.options.length > 0) {
            for (const option of this.options) {
                command += ` ${option.name}`;

                if (option.value) {
                    if (option.useEqualSign) {
                        command += '=';
                    } else {
                        command += ' ';
                    }
                    command += `"${option.value.replace(/"/g, '\\"')}"`;
                }
            }
        }

        if (this.arguments.length > 0) {
            for (const argument of this.arguments) {
                command += ` "${argument.replace(/"/g, '\\"')}"`;
            }
        }

        return command;
    }
}
