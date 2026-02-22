"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparencyRepository = void 0;
const base_repository_1 = require("./base.repository");
const deleteFile_1 = require("../storage/deleteFile");
const collection_name_1 = require("../const/collection.name");
class TransparencyRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.TRANSPARENCY_SEAL_COLLECTION);
    }
    async createTransparency(payload) {
        const { id } = await this.create(payload);
        return id;
    }
    async createTransparencyFolder(payload) {
        const ref = await this.db.collection(collection_name_1.TRANSPARENCY_FOLDER).add(payload); // creates doc
        return ref.id; // ✅ return only id
    }
    async updateTransparency(id, payload) {
        const docData = (await this.getById(id));
        // old file url
        const oldFileUrl = docData.file.url;
        // new file url
        const newFileUrl = payload.file && payload.file.url;
        delete payload.createdAt;
        // if files not same get delete old file
        if (oldFileUrl !== newFileUrl) {
            await (0, deleteFile_1.deleteFile)(oldFileUrl);
        }
        await this.update(id, payload);
    }
    async updateTransparencyFolder(id, payload) {
        await this.db.collection(collection_name_1.TRANSPARENCY_FOLDER).doc(id).update(payload);
    }
    async deleteTransparency(id) {
        const docData = (await this.getById(id));
        await this.delete(id);
        await (0, deleteFile_1.deleteFile)(docData.file.url);
    }
    async bulkDeleteTransparency(ids) {
        const unique = [...new Set(ids)].filter(Boolean);
        if (unique.length === 0)
            return;
        // 1) Fetch docs (chunked) so we can delete old files
        const fileUrlsToDelete = [];
        for (let i = 0; i < unique.length; i += 500) {
            const chunk = unique.slice(i, i + 500);
            const refs = chunk.map((id) => this.col().doc(id));
            const snaps = await this.db.getAll(...refs);
            for (const s of snaps) {
                if (!s.exists)
                    continue;
                const data = s.data();
                const url = data?.file?.url; // adjust if your structure differs
                if (url)
                    fileUrlsToDelete.push(url);
            }
        }
        // 2) Delete files (best-effort)
        // If you want strict behavior, remove try/catch and let it throw.
        await Promise.allSettled(fileUrlsToDelete.map((u) => (0, deleteFile_1.deleteFile)(u)));
        // 3) Delete docs
        await this.bulkDelete(unique);
    }
    async deleteTransparencyFolder(id) {
        const filters = [];
        // filter by folderId
        filters.push({ field: "folderId", op: "==", value: id });
        // get all transparency document in this folder
        const docData = (await this.listAllWithFilters(filters));
        // delete files from Firebase Storage
        if (docData.length > 0) {
            const files = docData.map((doc) => doc.file.url).filter((url) => Boolean(url)); // only keep valid strings
            if (files.length > 0)
                await (0, deleteFile_1.deleteFile)(files);
        }
        // get all document id in this folder
        const docIds = docData.map((doc) => doc.id);
        // delete transparency documents in this folder if exists
        if (docIds.length > 0) {
            await this.bulkDeleteTransparency(docIds);
        }
        // delete folder
        await this.db.collection(collection_name_1.TRANSPARENCY_FOLDER).doc(id).delete();
    }
    async listTransparencyFolders(filters = []) {
        let q = this.db.collection(collection_name_1.TRANSPARENCY_FOLDER);
        for (const f of filters)
            q = q.where(f.field, f.op, f.value);
        const snap = await q.get();
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    }
}
exports.TransparencyRepository = TransparencyRepository;
