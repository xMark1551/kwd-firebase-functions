"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = void 0;
const http_error_1 = require("../http/http.error");
class RateLimitError extends http_error_1.HttpError {
    constructor(message = "Rate limit exceeded", meta) {
        super(400, message, "RATE_LIMIT", meta);
    }
}
exports.RateLimitError = RateLimitError;
