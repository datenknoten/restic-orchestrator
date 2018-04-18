import { BaseError } from '../errors';

/**
 * Thrown if the config file is invalid
 */
export class ConfigFileInvalidError extends BaseError {
    /**
     * The reason the config file is invalid
     */
    public reason?: {} = {};
}
