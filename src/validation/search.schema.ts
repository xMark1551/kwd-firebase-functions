import { z } from "zod";

export const searchSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  file: z.object({
    name: z.string(),
    url: z.string(),
  }),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchSchema = z.infer<typeof searchSchema>;
