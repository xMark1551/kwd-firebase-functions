"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
const http_error_1 = require("../http/http.error");
class ValidationError extends http_error_1.HttpError {
    constructor(message = "Validation failed", meta) {
        super(400, message, "VALIDATION_ERROR", meta);
    }
}
exports.ValidationError = ValidationError;
