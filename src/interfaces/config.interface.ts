import { EnvironmentInterface } from '../interfaces';
export interface ConfigInterface {
    // SSH stuff
    user?: string;
    needsSudo?: boolean;
    host: string;
    // restic stuff
    backupPassword: string;
    repository: string;
    files: string[];
    exclude?: string[];
    env?: EnvironmentInterface;
    // operational stuff
    preCommand?: string;
    postCommand?: string;
}
