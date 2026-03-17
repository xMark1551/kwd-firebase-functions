import { HttpError } from "../http/http.error";

export class BadRequestError extends HttpError {
  constructor(message = "Bad request", meta?: unknown) {
    super(400, message, "BAD_REQUEST", meta);
  }
}
