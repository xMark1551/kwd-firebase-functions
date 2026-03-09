"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedPostSchema = exports.patchPostSchema = exports.createPostSchema = exports.postFilterSchema = exports.cursorSchema = void 0;
const zod_1 = require("zod");
const post_model_schema_1 = require("../model/post.model.schema");
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
exports.cursorSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1),
    firstCreatedAt: zod_1.z.coerce.number(),
    firstId: zod_1.z.string(),
    lastCreatedAt: zod_1.z.coerce.number(),
    lastId: zod_1.z.string(),
});
exports.postFilterSchema = zod_1.z.object({
    category: categorySchema.optional(),
    status: statusSchema.optional(),
    year: zod_1.z.coerce.number().int().min(2015).max(2100).optional(),
    month: zod_1.z.coerce.number().int().min(1).max(12).optional(),
    isFeatured: zod_1.z.coerce.boolean().optional(),
});
exports.createPostSchema = zod_1.z.object({
    authorId: zod_1.z.string().optional(),
    title: zod_1.z.string().nonempty("Title is required"),
    category: categorySchema,
    description: zod_1.z.string().nonempty("Description is required"),
    status: statusSchema,
    files: zod_1.z.array(zod_1.z.string()).default([]),
    isFeatured: zod_1.z.boolean().default(false),
});
exports.patchPostSchema = post_model_schema_1.postSchema
    .extend({
    files: zod_1.z.array(zod_1.z.string()).transform((arr) => arr.filter((v) => v !== "")), // remove empty strings
})
    .partial();
exports.getPaginatedPostSchema = zod_1.z.object({
    ...pagination_schema_1.paginationSchema.shape,
    filters: exports.postFilterSchema.optional(),
});
