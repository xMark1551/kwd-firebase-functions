"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.cursorSchema = void 0;
const zod_1 = require("zod");
exports.cursorSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
    firstCreatedAt: zod_1.z.coerce.number(),
    firstId: zod_1.z.string(),
    lastCreatedAt: zod_1.z.coerce.number(),
    lastId: zod_1.z.string(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1, "Page must be at least 1"),
    pageSize: zod_1.z.coerce.number().int().min(1).max(50).default(10),
    cursor: exports.cursorSchema.optional(),
});
