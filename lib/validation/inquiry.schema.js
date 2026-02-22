"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalInquiryCount = exports.getPaginatedInquiriesSchema = exports.inquiryFilterSchema = exports.createInquirySchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
exports.createInquirySchema = zod_1.z.object({
    reason: zod_1.z.string().nonempty("Service Inquiry is required"),
    name: zod_1.z.string().nonempty("Name is required"),
    email: zod_1.z.string().nonempty("Email is required"),
    message: zod_1.z.string().nonempty("Message is required"),
    file: zod_1.z.instanceof(File).optional(),
    isAgree: zod_1.z.boolean().refine((val) => val === true, {
        message: "You must agree to the terms and conditions",
    }),
});
exports.inquiryFilterSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
exports.getPaginatedInquiriesSchema = pagination_schema_1.paginationSchema.merge(exports.inquiryFilterSchema);
exports.getTotalInquiryCount = exports.inquiryFilterSchema;
