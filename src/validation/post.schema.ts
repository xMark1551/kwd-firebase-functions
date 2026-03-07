import { z } from "zod";

import { postSchema } from "../model/post.model.schema";
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

export type Post = z.infer<typeof postSchema>;

export const cursorSchema = z.object({
  page: z.coerce.number().int().min(1),

  firstCreatedAt: z.coerce.number(),
  firstId: z.string(),

  lastCreatedAt: z.coerce.number(),
  lastId: z.string(),
});

export type Cursor = z.infer<typeof cursorSchema>;

export const postFilterSchema = z.object({
  category: categorySchema.optional(),
  status: statusSchema.optional(),
  year: z.coerce.number().int().min(2015).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type PostFilter = z.infer<typeof postFilterSchema>;

export const createPostSchema = z.object({
  authorId: z.string().optional(),
  title: z.string().nonempty("Title is required"),
  category: categorySchema,
  description: z.string().nonempty("Description is required"),
  status: statusSchema,
  files: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
});

export type CreatePost = z.infer<typeof createPostSchema>;

export const patchPostSchema = postSchema
  .extend({
    files: z.array(z.string()).transform((arr) => arr.filter((v) => v !== "")), // remove empty strings
  })
  .partial();
export type PatchPost = z.infer<typeof patchPostSchema>;

export const getPaginatedPostSchema = z.object({
  ...paginationSchema.shape,
  filters: postFilterSchema.optional(),
});
export type GetPaginatedPostQuery = z.infer<typeof getPaginatedPostSchema>;
