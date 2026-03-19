"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogSchema = exports.getPaginatedActivityLogsSchema = exports.activityLogFilterSchema = exports.createActivityLogSchema = exports.targetSchema = exports.authorSchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
exports.authorSchema = zod_1.z.object({
    uid: zod_1.z.string(),
    admin: zod_1.z.boolean(),
    email: zod_1.z.string(),
});
exports.targetSchema = zod_1.z.object({
    snapshot: zod_1.z.any().optional(),
});
exports.createActivityLogSchema = zod_1.z.object({
    severity: zod_1.z.string(),
    author: exports.authorSchema.nullable(),
    action: zod_1.z.string(),
    target: exports.targetSchema,
    status: zod_1.z.string(),
    code: zod_1.z.number(),
    reason: zod_1.z.string().optional(),
    ip: zod_1.z.string().optional(),
});
exports.activityLogFilterSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
});
exports.getPaginatedActivityLogsSchema = zod_1.z.object({
    ...pagination_schema_1.paginationSchema.shape,
    filters: exports.activityLogFilterSchema.optional(),
});
exports.activityLogSchema = zod_1.z.object({
    id: zod_1.z.string(),
    severity: zod_1.z.string(),
    author: exports.authorSchema.nullable(),
    action: zod_1.z.string(),
    target: exports.targetSchema,
    status: zod_1.z.string(),
    code: zod_1.z.number(),
    reason: zod_1.z.string().optional(),
    ip: zod_1.z.string().optional(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
});
