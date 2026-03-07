"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
class HttpError extends Error {
    constructor(status, message, code, meta) {
        super(message);
        this.status = status;
        this.code = code;
        this.meta = meta;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HttpError = HttpError;
