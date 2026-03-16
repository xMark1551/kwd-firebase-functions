"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipartBusboy = void 0;
const busboy_1 = __importDefault(require("busboy"));
const multiplart_helper_1 = require("../utils/multiplart.helper");
const errors_1 = require("../errors");
const multipartBusboy = (opts) => {
    const maxFiles = opts?.maxFiles ?? 10;
    const maxFileSizeBytes = opts?.maxFileSizeBytes ?? 10 * 1024 * 1024;
    const allowedTypes = opts?.allowedTypes;
    const allowExtensionFallback = opts?.allowExtensionFallback ?? true;
    return (req, res, next) => {
        const ct = String(req.headers["content-type"] ?? "");
        if (!ct.includes("multipart/form-data"))
            return next();
        const bb = (0, busboy_1.default)({
            headers: req.headers,
            limits: { files: maxFiles, fileSize: maxFileSizeBytes },
        });
        const fields = {};
        const files = [];
        let fileCount = 0;
        let responded = false;
        const fail = (message, details) => {
            if (responded || res.headersSent)
                return;
            responded = true;
            bb.removeAllListeners();
            next({
                ok: false,
                status: 400,
                message,
                details: details?.message ?? String(details ?? ""),
            });
        };
        const arrayFields = new Set(["files"]);
        bb.on("field", (name, val) => {
            if (responded)
                return;
            if (arrayFields.has(name)) {
                const prev = fields[name];
                fields[name] = prev ? (Array.isArray(prev) ? [...prev, val] : [prev, val]) : [val];
            }
            else {
                fields[name] = val;
            }
        });
        bb.on("file", (_fieldname, file, info) => {
            if (responded) {
                file.resume();
                return;
            }
            fileCount += 1;
            if (fileCount > maxFiles) {
                file.resume();
                throw new errors_1.BadRequestError(`Too many files (max ${maxFiles})`);
            }
            const filename = info.filename || "";
            const mimeType = (info.mimeType || "").toLowerCase();
            if (!filename) {
                file.resume();
                return;
            }
            if (allowedTypes?.length) {
                const maybeUnknown = !mimeType || mimeType === "application/octet-stream" || mimeType === "binary/octet-stream";
                const ok = (0, multiplart_helper_1.matchesAllowed)(allowedTypes, mimeType, filename);
                const okWithFallback = ok || (allowExtensionFallback && maybeUnknown && (0, multiplart_helper_1.matchesAllowed)(allowedTypes, "", filename));
                if (!okWithFallback) {
                    file.resume();
                    throw new errors_1.BadRequestError(`File type not allowed`, { allowedTypes });
                }
            }
            const chunks = [];
            let hitLimit = false;
            file.on("data", (d) => {
                if (responded || hitLimit)
                    return;
                chunks.push(d);
            });
            file.on("limit", () => {
                hitLimit = true;
                file.resume();
                throw new errors_1.RateLimitError("File size limit exceeded", { limit: maxFileSizeBytes });
            });
            file.on("error", (err) => {
                file.resume();
                fail("File stream error", err);
            });
            file.on("end", () => {
                if (responded || hitLimit)
                    return;
                files.push({ filename, data: Buffer.concat(chunks), contentType: mimeType });
            });
        });
        bb.on("error", (err) => fail("Malformed multipart form data", err));
        bb.on("finish", () => {
            if (responded)
                return;
            bb.removeAllListeners();
            req.body = fields;
            req.filesToUpload = files;
            next();
        });
        // ✅ KEY FIX: write + end separately instead of bb.end(raw)
        const raw = req.rawBody;
        if (raw instanceof Buffer) {
            bb.write(raw);
            bb.end();
        }
        else {
            // Fallback: pipe directly from request stream
            req.pipe(bb);
        }
    };
};
exports.multipartBusboy = multipartBusboy;
