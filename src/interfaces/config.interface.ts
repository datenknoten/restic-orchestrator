export interface ConfigInterface {
    user?: string;
    needsSudo?: boolean;
    host: string;
    preCommand?: string;
    postCommand?: string;
}
