"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = exports.authedUserSchema = void 0;
const zod_1 = require("zod");
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
