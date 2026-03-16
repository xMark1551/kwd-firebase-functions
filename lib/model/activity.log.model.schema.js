"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogSchema = void 0;
const zod_1 = require("zod");
const activity_log_schema_1 = require("../validation/activity-log.schema");
exports.activityLogSchema = zod_1.z.object({
    id: zod_1.z.string(),
    severity: zod_1.z.string(),
    author: activity_log_schema_1.authorSchema.nullable(),
    action: zod_1.z.string(),
    target: activity_log_schema_1.targetSchema,
    status: zod_1.z.string(),
    code: zod_1.z.number(),
    reason: zod_1.z.string().optional(),
    ip: zod_1.z.string().optional(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
});
