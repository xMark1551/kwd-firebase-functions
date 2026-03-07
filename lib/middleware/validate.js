"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const errors_1 = require("../errors");
const validateBody = (schema) => (req, res, next) => {
    console.log("Validating body", req.body);
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return next(new errors_1.ValidationError("Validation failed", {
            details: result.error.flatten().fieldErrors,
        }));
    }
    // ✅ overwrite body with validated + sanitized data
    req.body = result.data;
    next();
};
exports.validateBody = validateBody;
const validateQuery = (schema) => (req, res, next) => {
    console.log("Validating query", req.query);
    const result = schema.safeParse(req.query);
    if (!result.success) {
        return next(new errors_1.ValidationError("Validation failed", {
            details: result.error.flatten().fieldErrors,
        }));
    }
    // ✅ overwrite query with validated + sanitized data
    req.validatedQuery = result.data;
    next();
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => (req, res, next) => {
    console.log("Validating params", req.params);
    const result = schema.safeParse(req.params);
    if (!result.success) {
        return next(new errors_1.ValidationError("Validation failed", {
            details: result.error.flatten().fieldErrors,
        }));
    }
    req.params = result.data;
    next();
};
exports.validateParams = validateParams;
