"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = void 0;
const http_error_1 = require("../http/http.error");
class UnauthorizedError extends http_error_1.HttpError {
    constructor(message = "Unauthorized", meta) {
        super(401, message, "UNAUTHORIZED", meta);
    }
}
exports.UnauthorizedError = UnauthorizedError;
