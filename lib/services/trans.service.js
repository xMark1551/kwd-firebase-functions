"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparencyService = void 0;
const deleteFile_1 = require("../storage/deleteFile");
class TransparencyService {
    constructor(sealRepo, folderRepo) {
        this.sealRepo = sealRepo;
        this.folderRepo = folderRepo;
    }
    async deleteTransparencyFolder(id) {
        const filters = [];
        // filter by folderId
        filters.push({ field: "folderId", op: "==", value: id });
        // get all transparency document in this folder
        const docData = (await this.sealRepo.listAllWithFilters(filters));
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
            await this.sealRepo.bulkDeleteTransparency(docIds);
        }
        // delete folder
        await this.folderRepo.delete(id);
    }
}
exports.TransparencyService = TransparencyService;
