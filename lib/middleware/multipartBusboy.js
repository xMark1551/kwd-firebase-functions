"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipartBusboy = void 0;
const busboy_1 = __importDefault(require("busboy"));
const multipartBusboy = (opts) => {
    const maxFiles = opts?.maxFiles ?? 10;
    const maxFileSizeBytes = opts?.maxFileSizeBytes ?? 10 * 1024 * 1024;
    const allowedMimeTypes = opts?.allowedMimeTypes;
    return (req, res, next) => {
        const ct = String(req.headers["content-type"] ?? "");
        if (!ct.includes("multipart/form-data"))
            return next();
        const raw = req.rawBody ?? req.body;
        if (!raw || !(raw instanceof Buffer)) {
            return res.status(400).json({
                ok: false,
                error: "Multipart body not available as Buffer (rawBody missing).",
            });
        }
        const bb = (0, busboy_1.default)({
            headers: req.headers,
            limits: {
                files: maxFiles,
                fileSize: maxFileSizeBytes,
            },
        });
        const fields = {};
        const files = [];
        let fileCount = 0;
        let aborted = false;
        let responded = false;
        const activeStreams = new Set();
        const cleanup = () => {
            // Drain all active file streams
            activeStreams.forEach((stream) => {
                if (typeof stream.resume === "function") {
                    stream.resume();
                }
            });
            activeStreams.clear();
            // Remove busboy listeners to prevent memory leaks
            bb.removeAllListeners();
        };
        const fail = (message, details) => {
            if (responded || res.headersSent)
                return;
            responded = true;
            cleanup();
            res.status(400).json({
                ok: false,
                error: message,
                details: details?.message ?? String(details ?? ""),
            });
        };
        const handleAbort = () => {
            aborted = true;
            responded = true;
            cleanup();
            // Don't send a response - connection is already closed
        };
        req.on("aborted", handleAbort);
        req.on("close", () => {
            if (!responded) {
                handleAbort();
            }
        });
        const arrayFields = new Set(["files"]);
        bb.on("field", (name, val) => {
            if (responded)
                return;
            if (arrayFields.has(name)) {
                const prev = fields[name];
                fields[name] = prev ? (Array.isArray(prev) ? [...prev, val] : [prev, val]) : [val];
                return;
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
            activeStreams.add(file);
            fileCount += 1;
            if (fileCount > maxFiles) {
                file.resume();
                activeStreams.delete(file);
                fail(`Too many files (max ${maxFiles})`);
                return;
            }
            const { filename, mimeType } = info;
            if (!filename) {
                file.resume();
                activeStreams.delete(file);
                return;
            }
            if (allowedMimeTypes && !allowedMimeTypes.includes(mimeType)) {
                file.resume();
                activeStreams.delete(file);
                fail(`Unsupported file type: ${mimeType}`);
                return;
            }
            const chunks = [];
            let hitLimit = false;
            file.on("data", (d) => {
                if (responded || hitLimit || aborted)
                    return;
                chunks.push(d);
            });
            file.on("limit", () => {
                hitLimit = true;
                file.resume();
                activeStreams.delete(file);
                fail(`File too large (>${maxFileSizeBytes} bytes)`);
            });
            file.on("error", (err) => {
                file.resume();
                activeStreams.delete(file);
                fail("File stream error", err);
            });
            file.on("end", () => {
                activeStreams.delete(file);
                if (responded || hitLimit || aborted)
                    return;
                const buffer = Buffer.concat(chunks);
                files.push({
                    filename,
                    data: buffer,
                    contentType: mimeType,
                });
            });
        });
        bb.on("error", (err) => {
            fail("Malformed multipart form data", err);
        });
        bb.on("finish", () => {
            if (responded || aborted) {
                cleanup();
                return;
            }
            // Clean up listeners
            req.removeListener("aborted", handleAbort);
            bb.removeAllListeners();
            req.body = fields;
            req.filesToUpload = files;
            next();
        });
        bb.end(raw);
    };
};
exports.multipartBusboy = multipartBusboy;
