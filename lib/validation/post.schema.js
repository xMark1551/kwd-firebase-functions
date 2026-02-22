"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalPostCount = exports.getPaginatedPostSchema = exports.patchPostSchema = exports.createPostSchema = exports.postFilterSchema = exports.postSchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
const categorySchema = zod_1.z.enum([
    "latest",
    "news",
    "updates",
    "events",
    "repair",
    "announcement",
    "gender-and-development",
]);
const statusSchema = zod_1.z.enum(["Published", "Draft"]);
exports.postSchema = zod_1.z.object({
    id: zod_1.z.string(),
    authorId: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    category: categorySchema,
    status: statusSchema,
    files: zod_1.z.array(zod_1.z.string()),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    isFeatured: zod_1.z.boolean(),
});
exports.postFilterSchema = zod_1.z.object({
    category: categorySchema.optional(),
    status: statusSchema.optional(),
    year: zod_1.z.coerce.number().int().min(2015).max(2100).optional(),
    month: zod_1.z.coerce.number().int().min(1).max(12).optional(),
});
exports.createPostSchema = zod_1.z.object({
    title: zod_1.z.string().nonempty("Title is required"),
    category: categorySchema,
    description: zod_1.z.string().nonempty("Description is required"),
    status: statusSchema,
    files: zod_1.z.array(zod_1.z.string()).default([]),
    isFeatured: zod_1.z.boolean().default(false),
});
exports.patchPostSchema = exports.postSchema.partial();
exports.getPaginatedPostSchema = pagination_schema_1.paginationSchema.merge(exports.postFilterSchema);
exports.getTotalPostCount = exports.postFilterSchema;
