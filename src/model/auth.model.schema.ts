import { z } from "zod";

export const authedUserSchema = z.object({
  ip: z.string().optional(),
  uid: z.string(),
  email: z.string(),
  admin: z.boolean(),
  username: z.string(),
});

export type AuthedUser = z.infer<typeof authedUserSchema>;

export const userSchema = z.object({
  ...authedUserSchema.shape,
  customToken: z.string(),
});

export type User = z.infer<typeof userSchema>;
