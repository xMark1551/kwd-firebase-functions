"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparencyFolderRepository = void 0;
const base_repository_1 = require("./base.repository");
const collection_name_1 = require("../const/collection.name");
class TransparencyFolderRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.TRANSPARENCY_SEAL_FOLDER);
    }
}
exports.TransparencyFolderRepository = TransparencyFolderRepository;
