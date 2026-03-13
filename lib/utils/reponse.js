"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fail = exports.ok = void 0;
const ok = (res, data, message = "Success", statusCode = 200) => {
    res.status(statusCode).json({ success: true, statusCode, message, data, error: null });
};
exports.ok = ok;
const fail = (res, code, message, statusCode = 400) => res.status(statusCode).json({ success: false, statusCode, message, data: null, error: { code, message } });
exports.fail = fail;
