"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchLogSettingsSchema = exports.logSettingsSchema = void 0;
const zod_1 = require("zod");
exports.logSettingsSchema = zod_1.z.object({
    id: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
    scheduleExpression: zod_1.z.string(), // Cron expression
    retentionDays: zod_1.z.number().int().min(1),
    batchSize: zod_1.z.number().int().min(1).max(500, "Batch size must be between 1 and 500").optional(),
    lastRun: zod_1.z.string().optional(),
    nextRun: zod_1.z.string().optional(),
});
exports.patchLogSettingsSchema = exports.logSettingsSchema.partial();
