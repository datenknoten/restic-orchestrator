/**
 * Base class for all error classes
 */
export abstract class BaseError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
    }
}
