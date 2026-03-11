import { rateLimit } from "express-rate-limit";

export const contactLimiter = rateLimit({
  windowMs: 12 * 60 * 60 * 1000, // 12 hours
  max: 3, // 3 requests per IP
  message: "Too many contact form submissions. Try again later.",
});
