"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginLimiter = exports.contactLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const errors_1 = require("../errors");
exports.contactLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 12 * 60 * 60 * 1000, // 12 hours
    max: 3, // 3 requests per IP
    handler: (req, res, next) => {
        next(new errors_1.RateLimitError("Rate limit exceeded"));
    },
});
exports.loginLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 5 failed attempts per IP
    skipSuccessfulRequests: true, // only count failed requests
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new errors_1.RateLimitError("Too many failed login attempts. Please try again after 15 minutes."));
    },
});
