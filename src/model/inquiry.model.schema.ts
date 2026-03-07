import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

export const inquirySchema = z.object({
  id: z.string(),
  reason: z.string(),
  name: z.string(),
  email: z.string(),
  message: z.string(),
  file: z
    .object({
      name: z.string(),
      url: z.string(),
    })
    .optional(),
  isAgree: z.boolean(),
  isRead: z.boolean(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

export type Inquiry = z.infer<typeof inquirySchema>;
