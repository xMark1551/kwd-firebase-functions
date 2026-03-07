import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema } from "zod";

import { ValidationError } from "../errors";

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  console.log("Validating body", req.body);
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return next(
      new ValidationError("Validation failed", {
        details: result.error.flatten().fieldErrors,
      }),
    );
  }

  // ✅ overwrite body with validated + sanitized data
  req.body = result.data;
  next();
};

export const validateQuery = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  console.log("Validating query", req.query);
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return next(
      new ValidationError("Validation failed", {
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
    console.log("Validating params", req.params);
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return next(
        new ValidationError("Validation failed", {
          details: result.error.flatten().fieldErrors,
        }),
      );
    }

    req.params = result.data as any;
    next();
  };
