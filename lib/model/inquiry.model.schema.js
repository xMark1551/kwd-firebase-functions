"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquirySchema = void 0;
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
exports.inquirySchema = zod_1.z.object({
    id: zod_1.z.string(),
    reason: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string(),
    message: zod_1.z.string(),
    file: zod_1.z
        .object({
        name: zod_1.z.string(),
        url: zod_1.z.string(),
    })
        .optional(),
    isAgree: zod_1.z.boolean(),
    isRead: zod_1.z.boolean(),
    createdAt: zod_1.z.instanceof(firestore_1.Timestamp),
    updatedAt: zod_1.z.instanceof(firestore_1.Timestamp),
});
