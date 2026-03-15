"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = uploadFiles;
const firebase_1 = require("../config/firebase");
const upload_1 = require("./upload");
async function uploadFiles(folder, files, options = {}) {
    const bucket = (0, firebase_1.getBucket)();
    const list = Array.isArray(files) ? files : [files];
    const uploaded = [];
    throw new Error("Not implemented");
    try {
        for (let i = 0; i < list.length; i++) {
            const f = list[i];
            const res = await (0, upload_1.uploadOne)(bucket, folder, f, options, i, list.length);
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
