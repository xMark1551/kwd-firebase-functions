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

export const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string(),
  description: z.string(),
  category: categorySchema,
  status: statusSchema,
  files: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  isFeatured: z.boolean(),
});

export type Post = z.infer<typeof postSchema>;

export const postFilterSchema = z.object({
  category: categorySchema.optional(),
  status: statusSchema.optional(),
  year: z.coerce.number().int().min(2015).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type PostFilter = z.infer<typeof postFilterSchema>;

export const createPostSchema = z.object({
  title: z.string().nonempty("Title is required"),
  category: categorySchema,
  description: z.string().nonempty("Description is required"),
  status: statusSchema,
  files: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
});

export type CreatePost = z.infer<typeof createPostSchema>;

export const patchPostSchema = postSchema.partial();
export type PatchPost = z.infer<typeof patchPostSchema>;

export const getPaginatedPostSchema = paginationSchema.merge(postFilterSchema);
export type GetPaginatedPostQuery = z.infer<typeof getPaginatedPostSchema>;

export const getTotalPostCount = postFilterSchema;
export type GetTotalPostCountQuery = z.infer<typeof getTotalPostCount>;
