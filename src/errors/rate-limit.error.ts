import { HttpError } from "../http/http.error";

export class RateLimitError extends HttpError {
  constructor(message = "Rate limit exceeded", meta?: unknown) {
    super(400, message, "RATE_LIMIT", meta);
  }
}
