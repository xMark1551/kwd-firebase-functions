import type { Request, Response, NextFunction } from "express";
import type { RequestHandler } from "express";

import { activityLogService } from "../services/activity.log.service";
import { logService } from "../services/logger.service";

// import { sanitizeBody } from "../utils/sanitize-body";

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

  const AUDIT_ERRORS = new Set([
    "LOGIN_FAILED",
    "INVALID_TOKEN",
    "RATE_LIMIT_EXCEEDED",
    "UNAUTHORIZED_ACCESS",
    "BAD_REQUEST",
    "RATE_LIMIT",
  ]);

  if (AUDIT_ERRORS.has(err.code)) {
    try {
      await activityLogService.fail(
        err.code,
        {
          snapshot: err.meta ?? {},
        },
        err.message,
      );
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  res.status(status).json({
    ok: false,
    message: err.message || "SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const serviceHandler = async <T>(
  action: string,
  fn: () => Promise<T>, // your actual service logic
  log = true, // whether to log
): Promise<T> => {
  try {
    const result = await fn();

    logService.info(action, "success");

    if (log)
      activityLogService.success(action, {
        snapshot: result ?? {},
      });

    return result;
  } catch (err: any) {
    logService.error(action, {
      snapshot: err ?? {},
    });

    activityLogService.fail(action, {}, err.message);

    throw err;
  }
};
