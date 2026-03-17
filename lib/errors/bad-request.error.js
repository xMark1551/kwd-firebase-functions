"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = void 0;
const http_error_1 = require("../http/http.error");
class BadRequestError extends http_error_1.HttpError {
    constructor(message = "Bad request", meta) {
        super(400, message, "BAD_REQUEST", meta);
    }
}
exports.BadRequestError = BadRequestError;
