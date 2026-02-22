"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idsSchema = exports.idSchema = void 0;
const zod_1 = require("zod");
exports.idSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1, "ID is required"),
});
exports.idsSchema = zod_1.z.array(zod_1.z.string().trim().min(1, "ID is required"));
