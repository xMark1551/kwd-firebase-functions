"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSchema = void 0;
const zod_1 = require("zod");
exports.searchSchema = zod_1.z.object({
    query: zod_1.z.string().trim().min(1, "Query is required"),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
});
