"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadOne = uploadOne;
const node_crypto_1 = require("node:crypto");
// ✅ Let TS infer the bucket type from firebase-admin
const nowKey = (name) => `${Date.now()}-${name.replace(/\s+/g, "_")}`;
function assertNotAborted(signal) {
    if (signal?.aborted)
        throw new Error("Upload cancelled");
}
async function uploadOne(bucket, folder, input, opts, index, total) {
    assertNotAborted(opts.signal);
    const objectPath = `${folder}/${nowKey(input.filename)}`;
    const file = bucket.file(objectPath);
    const downloadToken = opts.makePublic ? undefined : (0, node_crypto_1.randomUUID)();
    const baseMetadata = opts.makePublic
        ? input.contentType
            ? { contentType: input.contentType }
            : undefined
        : {
            ...(input.contentType ? { contentType: input.contentType } : {}),
            metadata: { firebaseStorageDownloadTokens: downloadToken },
        };
    opts.onProgress?.({
        index,
        total,
        filename: input.filename,
        stage: "start",
        loaded: 0,
    });
    // --- 1) Buffer upload (no real streaming progress available)
    if ("data" in input) {
        assertNotAborted(opts.signal);
        // coarse progress only
        opts.onProgress?.({
            index,
            total,
            filename: input.filename,
            stage: "upload",
            loaded: 0,
            size: input.data.length,
            percent: 0,
        });
        await file.save(input.data, { resumable: false, metadata: baseMetadata });
        opts.onProgress?.({
            index,
            total,
            filename: input.filename,
            stage: "upload",
            loaded: input.data.length,
            size: input.data.length,
            percent: 100,
        });
    }
    // --- 2) Local path upload (we can report coarse progress: start/done)
    else if ("path" in input) {
        assertNotAborted(opts.signal);
        opts.onProgress?.({
            index,
            total,
            filename: input.filename,
            stage: "upload",
            loaded: 0,
        });
        await bucket.upload(input.path, { destination: objectPath, metadata: baseMetadata });
        opts.onProgress?.({
            index,
            total,
            filename: input.filename,
            stage: "upload",
            loaded: 1,
            percent: 100,
        });
    }
    // --- 3) Stream upload (✅ true progress)
    else {
        await new Promise((resolve, reject) => {
            const ws = file.createWriteStream({ resumable: false, metadata: baseMetadata });
            let uploadedBytes = 0;
            const onAbort = () => ws.destroy(new Error("Upload cancelled"));
            opts.signal?.addEventListener("abort", onAbort, { once: true });
            input.stream.on("data", (chunk) => {
                uploadedBytes += chunk.length;
                opts.onProgress?.({
                    index,
                    total,
                    filename: input.filename,
                    stage: "upload",
                    loaded: uploadedBytes,
                    // size unknown for generic Readable
                });
                if (opts.signal?.aborted) {
                    ws.destroy(new Error("Upload cancelled"));
                }
            });
            input.stream
                .on("error", reject)
                .pipe(ws)
                .on("error", reject)
                .on("finish", () => resolve());
        });
    }
    assertNotAborted(opts.signal);
    let url;
    if (opts.makePublic) {
        await file.makePublic().catch(() => { });
        url = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(objectPath)}`;
    }
    else {
        url =
            `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
                `${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
    }
    opts.onProgress?.({
        index,
        total,
        filename: input.filename,
        stage: "done",
        loaded: 1,
        percent: 100,
    });
    return { path: objectPath, url, fileName: input.filename };
}
