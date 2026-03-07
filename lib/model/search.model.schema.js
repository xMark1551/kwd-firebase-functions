"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchResultSchema = void 0;
const zod_1 = require("zod");
exports.searchResultSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    category: zod_1.z.string(),
    file: zod_1.z.object({
        name: zod_1.z.string(),
        url: zod_1.z.string(),
    }),
    status: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
