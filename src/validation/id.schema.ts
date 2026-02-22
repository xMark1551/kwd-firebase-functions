import { z } from "zod";

export const idSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
});

export const idsSchema = z.array(z.string().trim().min(1, "ID is required"));
