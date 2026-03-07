"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparencyRepository = void 0;
const base_repository_1 = require("./base.repository");
const collection_name_1 = require("../const/collection.name");
class TransparencyRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.TRANSPARENCY_SEAL_COLLECTION);
    }
    async listTransparencyByFolderId(folderId) {
        if (!folderId)
            return [];
        const snap = await this.col().where("folderId", "==", folderId).get();
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    }
    async getTransparencyCountThisYear() {
        const year = new Date().getFullYear();
        const snap = await this.col().where("year", "==", year).get();
        return { count: snap.size };
    }
}
exports.TransparencyRepository = TransparencyRepository;
