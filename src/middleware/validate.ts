import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  console.log("Validating body", req.body);
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return next({
      status: 400,
      message: "Validation failed",
      details: result.error.flatten(),
    });
  }

  // ✅ overwrite body with validated + sanitized data
  req.body = result.data;
  next();
};

export const validateQuery = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return next({
      status: 404,
      message: "Not found",
      details: result.error.flatten(),
    });
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
      return next({
        status: 400,
        message: "Invalid params",
        details: result.error.flatten(),
      });
    }

    req.params = result.data as any;
    next();
  };
