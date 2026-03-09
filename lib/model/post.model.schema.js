"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSchema = void 0;
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
const categorySchema = zod_1.z.enum(["news", "updates", "events", "repair", "announcement", "gender-and-development"]);
const statusSchema = zod_1.z.enum(["Published", "Draft"]);
exports.postSchema = zod_1.z.object({
    id: zod_1.z.string(),
    authorId: zod_1.z.string(),
    title: zod_1.z.string().nonempty(),
    description: zod_1.z.string().nonempty(),
    category: categorySchema,
    status: statusSchema,
    files: zod_1.z.array(zod_1.z.string()).default([]),
    isFeatured: zod_1.z.boolean(),
    createdAt: zod_1.z.instanceof(firestore_1.Timestamp),
    updatedAt: zod_1.z.instanceof(firestore_1.Timestamp),
});
