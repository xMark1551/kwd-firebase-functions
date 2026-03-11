"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedActivityLogsSchema = exports.activityLogFilterSchema = exports.createActivityLogSchema = exports.metaSchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
exports.metaSchema = zod_1.z.object({
    user: zod_1.z
        .object({
        uid: zod_1.z.string(),
        username: zod_1.z.string(),
        admin: zod_1.z.boolean(),
    })
        .nullable(),
    method: zod_1.z.string(),
    path: zod_1.z.string().optional(),
    ip: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    body: zod_1.z.any().optional(),
    params: zod_1.z.any().optional(),
    query: zod_1.z.any().optional(),
    data: zod_1.z.any().optional(),
    details: zod_1.z.any().optional(),
});
exports.createActivityLogSchema = zod_1.z.object({
    level: zod_1.z.string(),
    status: zod_1.z.number().optional(),
    action: zod_1.z.string(),
    message: zod_1.z.string().optional(),
    meta: exports.metaSchema.optional(),
});
exports.activityLogFilterSchema = zod_1.z.object({
    level: zod_1.z.enum(["ALL", "ERROR", "WARN", "INFO", "DEBUG"]).optional(),
});
exports.getPaginatedActivityLogsSchema = zod_1.z.object({
    ...pagination_schema_1.paginationSchema.shape,
    filters: exports.activityLogFilterSchema.optional(),
});
