import { z } from "zod";
import { paginationSchema } from "./pagination.schema";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export const createInquirySchema = z.object({
  reason: z.enum(["service inquiry", "billing concern", "technical support"], "Reason is Invalid"),
  name: z.string().trim().nonempty("Name is required").max(10, "Name must be less than 50 characters"),
  email: z
    .string()
    .trim()
    .nonempty("Email is required")
    .email("Invalid email address")
    .max(50, "Email must be less than 50 characters"),
  message: z.string().trim().nonempty("Message is required").max(1000, "Message must be less than 1000 characters"),
  file: z
    .instanceof(File, { message: "Invalid file." })
    .refine((file) => ALLOWED_TYPES.includes(file.type), {
      message: "Only JPG, PNG, or PDF files are allowed.",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File must be less than 5MB.",
    })
    .nullable()
    .optional(),
  isAgree: z.preprocess(
    (val) => {
      if (typeof val === "string") return val.toLowerCase() === "true";
      return val;
    },
    z.boolean().refine((v) => v === true, { message: "You must agree to the terms and conditions" }),
  ),
  isRead: z.boolean().default(false),
});

export const inquiryFilterSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
});

export const getPaginatedInquiriesSchema = paginationSchema.merge(
  z.object({ filters: inquiryFilterSchema.optional() }),
);

export const getTotalInquiryCount = inquiryFilterSchema;

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
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type CreateInquiry = z.infer<typeof createInquirySchema>;
export type GetPaginatedInquiries = z.infer<typeof getPaginatedInquiriesSchema>;
export type GetTotalInquiryCount = z.infer<typeof getTotalInquiryCount>;
export type Inquiry = z.infer<typeof inquirySchema>;
