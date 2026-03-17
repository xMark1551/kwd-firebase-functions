"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message, zodError) {
        super(message);
        this.name = "ValidationError";
        this.zodError = zodError;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }
}
exports.ValidationError = ValidationError;
