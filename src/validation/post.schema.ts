import { z } from "zod";

import { paginationSchema } from "./pagination.schema";

const categorySchema = z.enum([
  "latest",
  "news",
  "updates",
  "events",
  "repair",
  "announcement",
  "gender-and-development",
]);

const statusSchema = z.enum(["Published", "Draft"]);

export const postFilterSchema = z.object({
  category: categorySchema.optional(),
  status: statusSchema.optional(),
  year: z.coerce.number().int().min(2015).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  isFeatured: z.coerce.boolean().optional(),
});

export const createPostSchema = z.object({
  authorId: z.string().optional(),
  title: z.string().nonempty("Title is required"),
  category: categorySchema,
  description: z.string().nonempty("Description is required"),
  status: statusSchema,
  files: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
});

export const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  category: categorySchema,
  status: statusSchema,
  files: z.array(z.string()).default([]),
  isFeatured: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const patchPostSchema = postSchema
  .extend({
    files: z.array(z.string()).transform((arr) => arr.filter((v) => v !== "")), // remove empty strings
  })
  .partial();

export const getPaginatedPostSchema = z.object({
  ...paginationSchema.shape,
  filters: postFilterSchema.optional(),
});

export type PostFilter = z.infer<typeof postFilterSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type PatchPost = z.infer<typeof patchPostSchema>;
export type GetPaginatedPostQuery = z.infer<typeof getPaginatedPostSchema>;
export type Post = z.infer<typeof postSchema>;
