"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = uploadFiles;
const firebase_admin_1 = require("firebase-admin");
const storage_1 = require("../config/storage");
const getBucket = () => (0, firebase_admin_1.storage)().bucket();
async function uploadFiles(folder, files, options = {}) {
    const bucket = getBucket();
    const list = Array.isArray(files) ? files : [files];
    const uploaded = [];
    try {
        for (let i = 0; i < list.length; i++) {
            const f = list[i];
            const res = await (0, storage_1.uploadOne)(bucket, folder, f, options, i, list.length);
            uploaded.push(res);
        }
        return uploaded.map((x) => x.url);
    }
    catch (err) {
        await Promise.allSettled(uploaded.map((x) => bucket
            .file(x.path)
            .delete()
            .catch(() => { })));
        throw err;
    }
}
