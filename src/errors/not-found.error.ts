import { HttpError } from "../http/http.error";

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found", meta?: unknown) {
    super(404, message, "NOT_FOUND", meta);
  }
}
