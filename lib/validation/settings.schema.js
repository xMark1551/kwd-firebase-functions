"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchLogSettingsSchema = exports.logSettingsSchema = void 0;
const zod_1 = require("zod");
exports.logSettingsSchema = zod_1.z.object({
    id: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
    scheduleExpression: zod_1.z.string(), // Cron expression
    retentionDays: zod_1.z.number().int().min(0),
    batchSize: zod_1.z.number().int().min(1).optional(),
    lastRun: zod_1.z.string().optional(),
    nextRun: zod_1.z.string().optional(),
});
exports.patchLogSettingsSchema = exports.logSettingsSchema.partial();
