"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
exports.contactLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 12 * 60 * 60 * 1000, // 12 hours
    max: 3, // 3 requests per IP
    message: "Too many contact form submissions. Try again later.",
});
