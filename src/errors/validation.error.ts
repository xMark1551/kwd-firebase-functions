import { HttpError } from "../http/http.error";

export class ValidationError extends HttpError {
  constructor(message = "Validation failed", meta?: unknown) {
    super(400, message, "VALIDATION_ERROR", meta);
  }
}
