"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = void 0;
const http_error_1 = require("../http/http.error");
class ForbiddenError extends http_error_1.HttpError {
    constructor(message = "Forbidden", meta) {
        super(403, message, "FORBIDDEN", meta);
    }
}
exports.ForbiddenError = ForbiddenError;
