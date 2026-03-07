"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogCleanupSettingsSchema = void 0;
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
exports.LogCleanupSettingsSchema = zod_1.z.object({
    id: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
    scheduleExpression: zod_1.z.string(),
    retentionDays: zod_1.z.number(),
    batchSize: zod_1.z.number(),
    lastRun: zod_1.z.instanceof(firestore_1.Timestamp).optional(),
    nextRun: zod_1.z.instanceof(firestore_1.Timestamp).optional(),
    createdAt: zod_1.z.instanceof(firestore_1.Timestamp).optional(),
    updatedAt: zod_1.z.instanceof(firestore_1.Timestamp).optional(),
});
