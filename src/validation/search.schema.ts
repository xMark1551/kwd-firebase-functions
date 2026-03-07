import { z } from "zod";

export const searchSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SearchSchema = z.infer<typeof searchSchema>;
