import { z } from "zod";

export const cursorSchema = z.object({
  page: z.coerce.number().int().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),

  firstCreatedAt: z.coerce.number(),
  firstId: z.string(),

  lastCreatedAt: z.coerce.number(),
  lastId: z.string(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1"),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  cursor: cursorSchema.optional(),
});

export type Cursor = z.infer<typeof cursorSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
