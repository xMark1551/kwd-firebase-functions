import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address").max(255, "Email too long"),
  password: z.string(), // let the firebase handle password validation to avoid conflict
});

export const authedUserSchema = z.object({
  ip: z.string().optional(),
  uid: z.string(),
  email: z.string(),
  admin: z.boolean(),
  username: z.string(),
});

export const userSchema = z.object({
  ...authedUserSchema.shape,
  customToken: z.string(),
});

export type AuthedUser = z.infer<typeof authedUserSchema>;
export type User = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
