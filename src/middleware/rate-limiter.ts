import { rateLimit } from "express-rate-limit";
import { RateLimitError } from "../errors";

export const contactLimiter = rateLimit({
  windowMs: 12 * 60 * 60 * 1000, // 12 hours
  max: 3, // 3 requests per IP
  handler: (req, res, next) => {
    next(new RateLimitError("Rate limit exceeded"));
  },
});
