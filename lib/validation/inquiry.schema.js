"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalInquiryCount = exports.getPaginatedInquiriesSchema = exports.inquiryFilterSchema = exports.createInquirySchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
exports.createInquirySchema = zod_1.z.object({
    reason: zod_1.z.enum(["service inquiry", "billing concern", "technical support"], "Reason is Invalid"),
    name: zod_1.z.string().trim().nonempty("Name is required").max(10, "Name must be less than 50 characters"),
    email: zod_1.z
        .string()
        .trim()
        .nonempty("Email is required")
        .email("Invalid email address")
        .max(50, "Email must be less than 50 characters"),
    message: zod_1.z.string().trim().nonempty("Message is required").max(1000, "Message must be less than 1000 characters"),
    file: zod_1.z
        .instanceof(File, { message: "Invalid file." })
        .refine((file) => ALLOWED_TYPES.includes(file.type), {
        message: "Only JPG, PNG, or PDF files are allowed.",
    })
        .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: "File must be less than 5MB.",
    })
        .nullable()
        .optional(),
    isAgree: zod_1.z.preprocess((val) => {
        if (typeof val === "string")
            return val.toLowerCase() === "true";
        return val;
    }, zod_1.z.boolean().refine((v) => v === true, { message: "You must agree to the terms and conditions" })),
    isRead: zod_1.z.boolean().default(false),
});
exports.inquiryFilterSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
exports.getPaginatedInquiriesSchema = pagination_schema_1.paginationSchema.merge(zod_1.z.object({ filters: exports.inquiryFilterSchema.optional() }));
exports.getTotalInquiryCount = exports.inquiryFilterSchema;
