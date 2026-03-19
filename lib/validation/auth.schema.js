"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = exports.authedUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().min(1, "Email is required").email("Invalid email address").max(255, "Email too long"),
    password: zod_1.z.string(), // let the firebase handle password validation to avoid conflict
});
exports.authedUserSchema = zod_1.z.object({
    ip: zod_1.z.string().optional(),
    uid: zod_1.z.string(),
    email: zod_1.z.string(),
    admin: zod_1.z.boolean(),
    username: zod_1.z.string(),
});
exports.userSchema = zod_1.z.object({
    ...exports.authedUserSchema.shape,
    customToken: zod_1.z.string(),
});
