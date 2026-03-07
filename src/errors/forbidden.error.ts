import { HttpError } from "../http/http.error";

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden", meta?: unknown) {
    super(403, message, "FORBIDDEN", meta);
  }
}
