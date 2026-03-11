"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().min(1, "Email is required").email("Invalid email address").max(255, "Email too long"),
    password: zod_1.z.string(), // let the firebase handle password validation to avoid conflict
});
