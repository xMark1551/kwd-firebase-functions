import type { Request, Response, NextFunction } from "express";
import type { RequestHandler } from "express";

import { activityLogService } from "../services/activity.log.service";

import { sanitizeBody } from "../utils/sanitize-body";

export const asyncHandler =
  <
    P = Record<string, string>,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Record<string, unknown>,
    Locals extends Record<string, any> = Record<string, any>,
  >(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
      res: Response<ResBody, Locals>,
      next: NextFunction,
    ) => any,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const errorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log("errorHandler", req.user);

  // Normalize status code
  const status =
    typeof err.status === "number" ? err.status : typeof err.statusCode === "number" ? err.statusCode : 500;

  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error to console for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("error log", err);
  }

  // Attempt to log error activity, but don't crash if logging fails
  try {
    await activityLogService.createLog({
      level: "ERROR",
      status,
      action: err.code || "SERVER_ERROR",
      message: err.message || "Unknown error",
      meta: {
        user: {
          uid: req.user?.uid ?? "anonymous",
          admin: req.user?.admin ?? false,
          username: req.user?.username ?? "",
        },
        path: req.path,
        method: req.method,
        ip: req.ip ?? "",
        userAgent: req.headers["user-agent"] ?? "",
        body: sanitizeBody(req.body),
        query: req.query,
        details: err.meta?.details ?? {},
      },
    });
  } catch (logErr) {
    console.error("Failed to log activity:", logErr);
  }

  res.status(status).json({
    ok: false,
    message: err.message || "SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
