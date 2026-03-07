"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogSchema = void 0;
const zod_1 = require("zod");
exports.activityLogSchema = zod_1.z.object({
    id: zod_1.z.string(),
    level: zod_1.z.string(),
    action: zod_1.z.string(),
    message: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    user: zod_1.z.string(),
});
