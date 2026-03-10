"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBody = sanitizeBody;
function sanitizeBody(body) {
    if (!body)
        return body;
    // If body is a Buffer (file upload), ignore it
    if (Buffer.isBuffer(body))
        return "[Buffer data omitted]";
    // If body contains nested buffers (like multipart data), replace them
    const sanitized = {};
    for (const key in body) {
        const value = body[key];
        if (Buffer.isBuffer(value)) {
            sanitized[key] = "[Buffer data omitted]";
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
