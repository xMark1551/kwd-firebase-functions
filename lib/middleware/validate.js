"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const validateBody = (schema) => (req, res, next) => {
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
exports.validateBody = validateBody;
const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        return next({
            status: 404,
            message: "Not found",
            details: result.error.flatten(),
        });
    }
    // ✅ overwrite query with validated + sanitized data
    req.validatedQuery = result.data;
    next();
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
        return next({
            status: 400,
            message: "Invalid params",
            details: result.error.flatten(),
        });
    }
    req.params = result.data;
    next();
};
exports.validateParams = validateParams;
