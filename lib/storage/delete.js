"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImagesCallable = void 0;
// functions/src/storage/delete.ts
const https_1 = require("firebase-functions/v2/https");
const storage_1 = require("firebase-admin/storage");
const auth_1 = require("../utils/auth");
function pathFromFirebaseDownloadUrl(url) {
    // Example:
    // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/news%2Fabc.png?alt=media&token=...
    const marker = "/o/";
    const i = url.indexOf(marker);
    if (i === -1)
        return null;
    const after = url.substring(i + marker.length);
    const encodedPath = after.split("?")[0];
    return decodeURIComponent(encodedPath);
}
exports.deleteImagesCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const data = request.data;
    if (!data?.urls?.length) {
        throw new https_1.HttpsError("invalid-argument", "urls is required");
    }
    const bucket = (0, storage_1.getStorage)().bucket();
    const results = [];
    for (const url of data.urls) {
        try {
            const path = pathFromFirebaseDownloadUrl(url);
            if (!path)
                throw new Error("Invalid download URL");
            await bucket.file(path).delete();
            results.push({ url, deleted: true });
        }
        catch (e) {
            results.push({ url, deleted: false, error: e?.message ?? "Unknown error" });
        }
    }
    return { results };
});
