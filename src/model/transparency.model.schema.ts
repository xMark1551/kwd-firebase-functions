import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

export const transparencySchema = z.object({
  authorId: z.string(),
  id: z.string(),
  title: z.string(),
  folder: z.string(),
  folderId: z.string().optional(),
  year: z.coerce.number(),
  file: z.object({
    name: z.string(),
    url: z.string(),
  }),
  status: z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

export type TransparencySeal = z.infer<typeof transparencySchema>;

export const TransparencyFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  year: z.coerce.number(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

export type TransparencyFolder = z.infer<typeof TransparencyFolderSchema>;
