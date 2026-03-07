"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const http_error_1 = require("../http/http.error");
class NotFoundError extends http_error_1.HttpError {
    constructor(message = "Resource not found", meta) {
        super(404, message, "NOT_FOUND", meta);
    }
}
exports.NotFoundError = NotFoundError;
