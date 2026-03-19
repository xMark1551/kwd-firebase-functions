import { z } from "zod";

import { paginationSchema } from "./pagination.schema";

export const createTransparencySchema = z.object({
  authorId: z.string().optional(),
  title: z.string().nonempty("Title is required"),
  year: z.coerce.number().int().min(2015, "Select a valid year"),
  status: z.enum(["Published", "Draft"]),
  date: z.string().optional(),
  folder: z.string().default("None"),
  folderId: z.string().optional(),
  file: z
    .union([
      z.instanceof(File),
      z.object({
        name: z.string().nonempty(),
        url: z.string().url(),
      }),
      z.null(),
      z.undefined(),
    ])
    .superRefine((val, ctx) => {
      // ✅ Type-safe check for missing file
      if (val == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File is required",
        });
      }
    }),
});

export const createTransparencyFolderSchema = z.object({
  title: z.string().nonempty("Title is required"),
  year: z.coerce.number().int().min(2015, "Select a valid year"),
  name: z.string().nonempty("Name is required"),
});

export const transparencyFilterSchema = z.object({
  year: z.coerce.number().optional(),
  status: z.string().optional(),
  title: z.string().optional(),
});

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
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const patchTransparencySchema = transparencySchema.partial();

export const patchTransparencyFolderSchema = createTransparencyFolderSchema.partial();

export const getPaginatedTransparencySchema = paginationSchema.merge(
  z.object({ filters: transparencyFilterSchema.optional() }),
);

export const getTotalTransparencyCountSchema = transparencyFilterSchema;

export const getTransparencyFolder = transparencyFilterSchema.omit({
  status: true,
});

export const getTransparencyWithFilters = transparencyFilterSchema.omit({
  title: true,
});

export const TransparencyFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  year: z.coerce.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type CreateTransparency = z.infer<typeof createTransparencySchema>;
export type CreateTransparencyFolder = z.infer<typeof createTransparencyFolderSchema>;
export type PatchTransparency = z.infer<typeof patchTransparencySchema>;
export type PatchTransparencyFolder = z.infer<typeof patchTransparencyFolderSchema>;
export type TransparencyFilter = z.infer<typeof transparencyFilterSchema>;
export type GetPaginatedTransparency = z.infer<typeof getPaginatedTransparencySchema>;
export type GetTotalTransparencyCount = z.infer<typeof getTotalTransparencyCountSchema>;
export type GetTransparencyFolderWithFilters = z.infer<typeof getTransparencyFolder>;
export type GetTransparencyWithFilters = z.infer<typeof getTransparencyWithFilters>;
export type TransparencySeal = z.infer<typeof transparencySchema>;
export type TransparencyFolder = z.infer<typeof TransparencyFolderSchema>;
