import { z } from "zod";
import { paginationSchema } from "./pagination.schema";

export const createInquirySchema = z.object({
  reason: z.string().nonempty("Service Inquiry is required"),
  name: z.string().nonempty("Name is required"),
  email: z.string().nonempty("Email is required"),
  message: z.string().nonempty("Message is required"),
  file: z.instanceof(File).optional(),
  isAgree: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});
export type CreateInquirySchema = z.infer<typeof createInquirySchema>;

export const inquiryFilterSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
});

export const getPaginatedInquiriesSchema = paginationSchema.merge(inquiryFilterSchema);
export type GetPaginatedInquiriesSchema = z.infer<typeof getPaginatedInquiriesSchema>;

export const getTotalInquiryCount = inquiryFilterSchema;
export type GetTotalInquiryCount = z.infer<typeof getTotalInquiryCount>;
