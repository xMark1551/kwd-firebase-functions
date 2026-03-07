"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningError = void 0;
const http_error_1 = require("../http/http.error");
class WarningError extends http_error_1.HttpError {
    constructor(message = "Warning", meta) {
        super(200, message, "WARNING", meta); // 200 OK but marked as warning
    }
}
exports.WarningError = WarningError;
