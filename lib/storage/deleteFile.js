"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupFiles = exports.getFilesToDelete = exports.getFiletoDelete = void 0;
exports.deleteFile = deleteFile;
const firebase_1 = require("../config/firebase");
const getFiletoDelete = (oldFileUrl, newFileUrl) => {
    if (!newFileUrl)
        return [];
    if (oldFileUrl !== newFileUrl) {
        return [oldFileUrl];
    }
    return [];
};
exports.getFiletoDelete = getFiletoDelete;
const getFilesToDelete = (oldFiles, newFiles) => {
    if (!newFiles)
        return [];
    const oldFileUrls = oldFiles?.filter((item) => typeof item === "string") ?? [];
    return oldFileUrls.filter((url) => !newFiles.includes(url));
};
exports.getFilesToDelete = getFilesToDelete;
const cleanupFiles = async (fileUrls) => {
    if (typeof fileUrls === "string")
        fileUrls = [fileUrls];
    if (!fileUrls.length)
        return { total: 0, deleted: 0, failed: 0, results: [] };
    try {
        return await deleteFile(fileUrls);
    }
    catch (error) {
        console.error("Failed to cleanup files:", error);
        return { total: 0, deleted: 0, failed: fileUrls.length, results: [] };
    }
};
exports.cleanupFiles = cleanupFiles;
async function deleteFile(imageRefs) {
    const bucket = (0, firebase_1.getBucket)();
    const arr = Array.isArray(imageRefs) ? imageRefs : [imageRefs];
    const toObjectPath = (value) => {
        if (value.startsWith("gs://")) {
            const without = value.replace("gs://", "");
            const slash = without.indexOf("/");
            return slash >= 0 ? without.slice(slash + 1) : null;
        }
        if (value.includes("/o/")) {
            try {
                const encoded = value.split("/o/")[1]?.split("?")[0];
                if (!encoded)
                    return null;
                return decodeURIComponent(encoded);
            }
            catch {
                return null;
            }
        }
        if (value.includes("storage.googleapis.com/")) {
            const parts = value.split("storage.googleapis.com/")[1];
            if (!parts)
                return null;
            const firstSlash = parts.indexOf("/");
            return firstSlash >= 0 ? decodeURIComponent(parts.slice(firstSlash + 1)) : null;
        }
        return value.trim() || null;
    };
    const settled = await Promise.allSettled(arr
        .filter((v) => typeof v === "string" && v.trim())
        .map(async (original) => {
        const objectPath = toObjectPath(original);
        if (!objectPath) {
            throw new Error("Invalid object path");
        }
        await bucket.file(objectPath).delete({ ignoreNotFound: true });
        return { original, objectPath };
    }));
    const results = settled.map((r, index) => {
        const original = arr[index];
        const objectPath = toObjectPath(original);
        if (r.status === "fulfilled") {
            return {
                original,
                objectPath,
                success: true,
            };
        }
        return {
            original,
            objectPath,
            success: false,
            error: r.reason,
        };
    });
    return {
        total: results.length,
        deleted: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
    };
}
