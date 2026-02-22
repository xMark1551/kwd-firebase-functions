"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultipart = parseMultipart;
const busboy_1 = __importDefault(require("busboy"));
async function parseMultipart(req) {
    return await new Promise((resolve, reject) => {
        const bb = (0, busboy_1.default)({ headers: req.headers });
        const fields = {};
        const files = [];
        bb.on("field", (name, val) => {
            fields[name] = val;
        });
        bb.on("file", (fieldname, file, info) => {
            const chunks = [];
            file.on("data", (d) => chunks.push(d));
            file.on("error", reject);
            file.on("end", () => {
                if (!info.filename)
                    return;
                files.push({
                    fieldname,
                    filename: info.filename,
                    contentType: info.mimeType,
                    data: Buffer.concat(chunks),
                });
            });
        });
        bb.on("error", reject);
        bb.on("finish", () => resolve({ fields, files }));
        // ✅ Firebase Functions: use rawBody (fallback to req.body if needed)
        const raw = req.rawBody ?? req.body;
        bb.end(raw);
    });
}
