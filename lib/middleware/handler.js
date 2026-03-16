"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceHandler = exports.errorHandler = exports.asyncHandler = void 0;
const activity_log_service_1 = require("../services/activity.log.service");
const logger_service_1 = require("../services/logger.service");
// import { sanitizeBody } from "../utils/sanitize-body";
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
const errorHandler = async (err, req, res, next) => {
    // Normalize status code
    const status = typeof err.status === "number" ? err.status : typeof err.statusCode === "number" ? err.statusCode : 500;
    // If headers already sent, delegate to default Express handler
    if (res.headersSent) {
        return next(err);
    }
    // Log error to console for debugging
    if (process.env.NODE_ENV === "development") {
        console.error("error log", err);
    }
    const AUDIT_ERRORS = new Set([
        "LOGIN_FAILED",
        "INVALID_TOKEN",
        "RATE_LIMIT_EXCEEDED",
        "UNAUTHORIZED_ACCESS",
        "BAD_REQUEST",
        "RATE_LIMIT",
    ]);
    if (AUDIT_ERRORS.has(err.code)) {
        try {
            await activity_log_service_1.activityLogService.fail(err.code, {}, err.message);
        }
        catch (error) {
            console.error("Failed to log activity:", error);
        }
    }
    res.status(status).json({
        ok: false,
        message: err.message || "SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const serviceHandler = async (action, fn, // your actual service logic
log = true) => {
    try {
        const result = await fn();
        logger_service_1.logService.info(action, "success");
        if (log)
            activity_log_service_1.activityLogService.success(action, {
                snapshot: result ?? {},
            });
        return result;
    }
    catch (err) {
        logger_service_1.logService.error(action, {
            snapshot: err ?? {},
        });
        activity_log_service_1.activityLogService.fail(action, {}, err.message);
        throw err;
    }
};
exports.serviceHandler = serviceHandler;
