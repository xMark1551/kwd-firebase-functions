export class HttpError extends Error {
  status: number;
  context?: string;
  code?: string;
  meta?: unknown;

  constructor(status: number, message: string, code?: string, meta?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.meta = meta;

    Error.captureStackTrace(this, this.constructor);
  }
}
