import { z } from "zod";

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
