import { rateLimit } from "express-rate-limit";
import { RateLimitError } from "../errors";

export const contactLimiter = rateLimit({
  windowMs: 12 * 60 * 60 * 1000, // 12 hours
  max: 3, // 3 requests per IP
  handler: (req, res, next) => {
    next(new RateLimitError("Rate limit exceeded"));
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 5 failed attempts per IP
  skipSuccessfulRequests: true, // only count failed requests
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitError("Too many failed login attempts. Please try again after 15 minutes."));
  },
});
