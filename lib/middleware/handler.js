"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.asyncHandler = void 0;
const activity_log_service_1 = require("../services/activity.log.service");
const sanitize_body_1 = require("../utils/sanitize-body");
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
const errorHandler = async (err, req, res, next) => {
    console.log("errorHandler", req.user);
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
    // Attempt to log error activity, but don't crash if logging fails
    try {
        await activity_log_service_1.activityLogService.createLog({
            level: "ERROR",
            status,
            action: err.code || "SERVER_ERROR",
            message: err.message || "Unknown error",
            meta: {
                user: {
                    uid: req.user?.uid ?? "anonymous",
                    admin: req.user?.admin ?? false,
                    username: req.user?.username ?? "",
                },
                path: req.path,
                method: req.method,
                ip: req.ip ?? "",
                userAgent: req.headers["user-agent"] ?? "",
                body: (0, sanitize_body_1.sanitizeBody)(req.body),
                query: req.query,
                details: err.meta?.details ?? {},
            },
        });
    }
    catch (logErr) {
        console.error("Failed to log activity:", logErr);
    }
    res.status(status).json({
        ok: false,
        message: err.message || "SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
