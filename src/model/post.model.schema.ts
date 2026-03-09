import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

const categorySchema = z.enum(["news", "updates", "events", "repair", "announcement", "gender-and-development"]);

const statusSchema = z.enum(["Published", "Draft"]);

export const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  category: categorySchema,
  status: statusSchema,
  files: z.array(z.string()).default([]),
  isFeatured: z.boolean(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

// Type inferred from Zod
export type Post = z.infer<typeof postSchema>;
