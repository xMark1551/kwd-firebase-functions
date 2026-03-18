import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema } from "zod";

import { BadRequestError } from "../errors";

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    const firstError = Object.values(fieldErrors as Record<string, string[]>)[0]?.[0] || "Validation failed";

    return next(
      new BadRequestError(firstError, {
        details: result.error.flatten().fieldErrors,
      }),
    );
  }

  // ✅ overwrite body with validated + sanitized data
  req.body = result.data;
  next();
};

export const validateQuery = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return next(
      new BadRequestError("Validation failed", {
        details: result.error.flatten().fieldErrors,
      }),
    );
  }

  // ✅ overwrite query with validated + sanitized data
  (req as any).validatedQuery = result.data;
  next();
};

export const validateParams =
  (schema: ZodSchema): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return next(
        new BadRequestError("Validation failed", {
          details: result.error.flatten().fieldErrors,
        }),
      );
    }

    req.params = result.data as any;
    next();
  };
