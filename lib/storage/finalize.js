"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeUploadsCallable = void 0;
// functions/src/storage/finalize.ts
const https_1 = require("firebase-functions/v2/https");
const storage_1 = require("firebase-admin/storage");
const auth_1 = require("../utils/auth");
exports.finalizeUploadsCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const data = request.data;
    if (!data?.moves?.length) {
        throw new https_1.HttpsError("invalid-argument", "moves is required");
    }
    const bucket = (0, storage_1.getStorage)().bucket();
    for (const m of data.moves) {
        if (!m?.tempPath || !m?.finalPath) {
            throw new https_1.HttpsError("invalid-argument", "Each move needs tempPath + finalPath");
        }
        const tempFile = bucket.file(m.tempPath);
        const finalFile = bucket.file(m.finalPath);
        // copy then delete (best-effort delete)
        await tempFile.copy(finalFile);
        await tempFile.delete().catch(() => { });
    }
    return { ok: true };
});
