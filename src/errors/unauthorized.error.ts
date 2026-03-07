import { HttpError } from "../http/http.error";

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized", meta?: unknown) {
    super(401, message, "UNAUTHORIZED", meta);
  }
}
