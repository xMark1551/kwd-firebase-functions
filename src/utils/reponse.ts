import { Response } from "express";

const ok = (res: Response, data: unknown, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({ success: true, statusCode, message, data, error: null });
};

const fail = (res: Response, code: string, message: string, statusCode = 400) =>
  res.status(statusCode).json({ success: false, statusCode, message, data: null, error: { code, message } });

export { ok, fail };
