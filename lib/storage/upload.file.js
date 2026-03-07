"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
const firebase_1 = require("../config/firebase");
const upload_1 = require("./upload");
async function uploadFile(folder, file, options = {}) {
    const bucket = (0, firebase_1.getBucket)();
    if (!file)
        throw new Error("No file provided");
    const uploaded = await (0, upload_1.uploadOne)(bucket, folder, file, options, 0, 1);
    return {
        url: uploaded.url,
        name: uploaded.fileName,
    };
}
