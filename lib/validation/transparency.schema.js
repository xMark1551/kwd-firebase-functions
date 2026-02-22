"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransparencyWithFilters = exports.getTransparencyFolder = exports.getTotalTransparencyCountSchema = exports.getPaginatedTransparencySchema = exports.patchTransparencyFolderSchema = exports.patchTransparencySchema = exports.transparencyFilterSchema = exports.TransparencyFolderSchema = exports.TransparencySchema = exports.createTransparencyFolderSchema = exports.createTransparencySchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
exports.createTransparencySchema = zod_1.z.object({
    title: zod_1.z.string().nonempty("Title is required"),
    year: zod_1.z.coerce.number().int().min(2015, "Select a valid year"),
    status: zod_1.z.enum(["Published", "Draft"]),
    date: zod_1.z.string().optional(),
    folder: zod_1.z.string().default("None"),
    folderId: zod_1.z.string().optional(),
    file: zod_1.z
        .union([
        zod_1.z.instanceof(File),
        zod_1.z.object({
            name: zod_1.z.string().nonempty(),
            url: zod_1.z.string().url(),
        }),
        zod_1.z.null(),
        zod_1.z.undefined(),
    ])
        .superRefine((val, ctx) => {
        // ✅ Type-safe check for missing file
        if (val == null) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "File is required",
            });
        }
    }),
});
exports.createTransparencyFolderSchema = zod_1.z.object({
    title: zod_1.z.string().nonempty("Title is required"),
    year: zod_1.z.coerce.number().int().min(2015, "Select a valid year"),
    name: zod_1.z.string().nonempty("Name is required"),
});
exports.TransparencySchema = zod_1.z.object({
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
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.TransparencyFolderSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    title: zod_1.z.string(),
    year: zod_1.z.coerce.number(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.transparencyFilterSchema = zod_1.z.object({
    year: zod_1.z.coerce.number().optional(),
    status: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
});
exports.patchTransparencySchema = exports.TransparencySchema.partial();
exports.patchTransparencyFolderSchema = exports.createTransparencyFolderSchema.partial();
exports.getPaginatedTransparencySchema = pagination_schema_1.paginationSchema.merge(exports.transparencyFilterSchema);
exports.getTotalTransparencyCountSchema = exports.transparencyFilterSchema;
exports.getTransparencyFolder = exports.transparencyFilterSchema.omit({
    status: true,
});
exports.getTransparencyWithFilters = exports.transparencyFilterSchema.omit({
    title: true,
});
