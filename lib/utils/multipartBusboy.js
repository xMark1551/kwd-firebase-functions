"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultipart = parseMultipart;
// src/utils/multipartBusboy.ts
const busboy_1 = __importDefault(require("busboy"));
function assertMultipart(req) {
    const ct = String(req.headers?.["content-type"] ?? "");
    if (!ct.includes("multipart/form-data")) {
        const err = new Error("Expected multipart/form-data");
        err.status = 400;
        throw err;
    }
}
async function parseMultipart(req, opts = {}) {
    assertMultipart(req);
    const { limits, allowedMimeTypes, signal } = opts;
    return new Promise((resolve, reject) => {
        const bb = (0, busboy_1.default)({ headers: req.headers, limits });
        const fields = {};
        const files = [];
        let done = false;
        const finish = (err, result) => {
            if (done)
                return;
            done = true;
            if (err)
                reject(err);
            else
                resolve(result);
        };
        const abortErr = () => {
            const err = new Error("Client cancelled");
            err.status = 499; // client closed request (nginx style)
            return err;
        };
        if (signal) {
            if (signal.aborted)
                return finish(abortErr());
            signal.addEventListener("abort", () => finish(abortErr()), { once: true });
        }
        bb.on("field", (name, val) => {
            // Busboy may return val as string; for safety cast to string
            fields[name] = String(val);
        });
        bb.on("file", (fieldname, file, info) => {
            const { filename, mimeType } = info;
            // If no filename, consume stream and ignore (empty file input)
            if (!filename) {
                file.resume();
                return;
            }
            if (allowedMimeTypes?.length && mimeType && !allowedMimeTypes.includes(mimeType)) {
                file.resume();
                const err = new Error(`Unsupported file type: ${mimeType}`);
                err.status = 400;
                finish(err);
                return;
            }
            const chunks = [];
            file.on("data", (d) => chunks.push(d));
            file.on("limit", () => {
                // triggered when fileSize limit reached
                const err = new Error("File too large");
                err.status = 413;
                finish(err);
            });
            file.on("error", (e) => {
                const err = new Error(e?.message ?? "File stream error");
                err.status = 400;
                finish(err);
            });
            file.on("end", () => {
                files.push({
                    fieldname,
                    filename,
                    data: Buffer.concat(chunks),
                    contentType: mimeType,
                });
            });
        });
        bb.on("filesLimit", () => {
            const err = new Error("Too many files");
            err.status = 413;
            finish(err);
        });
        bb.on("fieldsLimit", () => {
            const err = new Error("Too many fields");
            err.status = 413;
            finish(err);
        });
        bb.on("error", (e) => {
            const err = new Error(e?.message ?? "Malformed form data");
            err.status = 400;
            finish(err);
        });
        bb.on("finish", () => {
            finish(undefined, { fields, files });
        });
        // Firebase Functions gen2 provides rawBody for streaming safety
        bb.end(req.rawBody);
    });
}
