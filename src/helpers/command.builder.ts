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
     * If the command needs to be run with sudo
     */
    public hasSudo: boolean = false;
    /**
     * Optional options for the command
     */
    public options: CommandOptionInterface[] = [];
    /**
     * Optional arguments for the command
     */
    public arguments: string[] = [];

    /**
     * Render the given environment variables
     */
    private renderEnv(): string {
        let command = '';

        if (Object.keys(this.env).length > 0) {
            for (const key of Object.keys(this.env)) {
                command += `${key}="${this.env[key].replace(/"/g, '\\"')}" `;
            }
        }

        return command;
    }

    /**
     * Render the given options
     */
    private renderOptions(): string {
        let command = '';
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

        return command;
    }

    /**
     * Renter the given arguments
     */
    private renderArguments(): string {
        let command = '';

        if (this.arguments.length > 0) {
            for (const argument of this.arguments) {
                command += ` "${argument.replace(/"/g, '\\"')}"`;
            }
        }

        return command;
    }

    /**
     * Render the final command
     */
    public render(): string {
        let command = '';

        command += this.renderEnv();

        if (this.hasSudo) {
            command += '/usr/bin/sudo --preserve-env ';
        }

        command += this.command;

        command += this.renderOptions();

        command += this.renderArguments();

        return command;
    }
}
