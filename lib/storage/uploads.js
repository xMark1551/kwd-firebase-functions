"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadNewsImages = void 0;
const https_1 = require("firebase-functions/v2/https");
const busboy_1 = __importDefault(require("busboy"));
const storage_1 = require("../config/storage");
exports.uploadNewsImages = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== "POST")
        return res.status(405).json({ ok: false, error: "Use POST" });
    const ct = req.headers["content-type"] || "";
    if (!ct.includes("multipart/form-data")) {
        return res.status(400).json({ ok: false, error: "Expected multipart/form-data" });
    }
    const ac = new AbortController();
    // client cancelled / disconnected
    req.on("aborted", () => ac.abort());
    const bb = (0, busboy_1.default)({ headers: req.headers });
    const buffers = [];
    const fields = {};
    let responded = false;
    const safeJson = (code, body) => {
        if (responded || res.headersSent)
            return;
        responded = true;
        res.status(code).json(body);
    };
    bb.on("field", (name, val) => {
        fields[name] = val;
    });
    bb.on("file", (_fieldname, file, info) => {
        const chunks = [];
        file.on("data", (d) => chunks.push(d));
        file.on("error", (e) => {
            console.error("File stream error:", e);
            safeJson(400, { ok: false, error: e?.message ?? "File stream error" });
        });
        file.on("end", () => {
            if (!info.filename)
                return;
            buffers.push({
                filename: info.filename,
                data: Buffer.concat(chunks),
                contentType: info.mimeType,
            });
        });
    });
    bb.on("error", (e) => {
        console.error("Busboy error:", e);
        safeJson(400, { ok: false, error: e?.message ?? "Malformed form data" });
    });
    bb.on("finish", async () => {
        try {
            if (ac.signal.aborted) {
                return safeJson(400, { ok: false, error: "Client cancelled" });
            }
            const folder = fields.folder || "news";
            // ✅ IMPORTANT: pass signal so uploadFiles can stop mid-way (as much as possible)
            const result = await (0, storage_1.uploadFiles)(folder, buffers, { signal: ac.signal });
            return safeJson(200, { ok: true, result });
        }
        catch (e) {
            console.error("Upload error:", e);
            if (ac.signal.aborted) {
                return safeJson(499, { ok: false, error: "Client cancelled" });
            }
            return safeJson(500, { ok: false, error: e?.message ?? "Upload failed" });
        }
    });
    // gen2: use rawBody
    bb.end(req.rawBody);
});
