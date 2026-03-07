import { z } from "zod";

import { transparencySchema } from "../model/transparency.model.schema";
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

export type CreateTransparency = z.infer<typeof createTransparencySchema>;

export const createTransparencyFolderSchema = z.object({
  title: z.string().nonempty("Title is required"),
  year: z.coerce.number().int().min(2015, "Select a valid year"),
  name: z.string().nonempty("Name is required"),
});

export type CreateTransparencyFolder = z.infer<typeof createTransparencyFolderSchema>;

export const transparencyFilterSchema = z.object({
  year: z.coerce.number().optional(),
  status: z.string().optional(),
  title: z.string().optional(),
});

export const patchTransparencySchema = transparencySchema.partial();
export type PatchTransparency = z.infer<typeof patchTransparencySchema>;

export const patchTransparencyFolderSchema = createTransparencyFolderSchema.partial();
export type PatchTransparencyFolder = z.infer<typeof patchTransparencyFolderSchema>;

export type TransparencyFilter = z.infer<typeof transparencyFilterSchema>;

export const getPaginatedTransparencySchema = paginationSchema.merge(
  z.object({ filters: transparencyFilterSchema.optional() }),
);
export type GetPaginatedTransparency = z.infer<typeof getPaginatedTransparencySchema>;

export const getTotalTransparencyCountSchema = transparencyFilterSchema;
export type GetTotalTransparencyCount = z.infer<typeof getTotalTransparencyCountSchema>;

export const getTransparencyFolder = transparencyFilterSchema.omit({
  status: true,
});
export type GetTransparencyFolderWithFilters = z.infer<typeof getTransparencyFolder>;

export const getTransparencyWithFilters = transparencyFilterSchema.omit({
  title: true,
});
export type GetTransparencyWithFilters = z.infer<typeof getTransparencyWithFilters>;
