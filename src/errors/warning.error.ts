import { HttpError } from "../http/http.error";

export class WarningError extends HttpError {
  constructor(message = "Warning", meta?: unknown) {
    super(200, message, "WARNING", meta); // 200 OK but marked as warning
  }
}
