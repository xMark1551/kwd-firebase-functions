"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparencyFolderSchema = exports.transparencySchema = void 0;
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
exports.transparencySchema = zod_1.z.object({
    authorId: zod_1.z.string(),
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    folder: zod_1.z.string(),
    folderId: zod_1.z.string().optional(),
    year: zod_1.z.coerce.number(),
    file: zod_1.z.object({
        name: zod_1.z.string(),
        url: zod_1.z.string(),
    }),
    status: zod_1.z.string(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
});
exports.TransparencyFolderSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    title: zod_1.z.string(),
    year: zod_1.z.coerce.number(),
    createdAt: zod_1.z.instanceof(firestore_1.Timestamp),
    updatedAt: zod_1.z.instanceof(firestore_1.Timestamp),
});
