"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transparencyService = exports.TransparencyService = void 0;
const firebase_1 = require("../config/firebase");
const transaprency_repository_1 = require("../repositories/transaprency.repository");
const transparencyFolder_repo_1 = require("../repositories/transparencyFolder.repo");
const cache_1 = require("../utils/cache");
const logger_service_1 = require("./logger.service");
const upload_file_1 = require("../storage/upload.file");
const filter_builder_1 = require("../utils/filter.builder");
const with_rollback_1 = require("../utils/with.rollback");
const deleteFile_1 = require("../storage/deleteFile");
const collection_name_1 = require("../const/collection.name");
const transparencyRepo = new transaprency_repository_1.TransparencyRepository(firebase_1.db);
const folderRepo = new transparencyFolder_repo_1.TransparencyFolderRepository(firebase_1.db);
class TransparencyService {
    constructor(transparencyRepo, folderRepo, cache, logger, prefix = "transparency") {
        this.transparencyRepo = transparencyRepo;
        this.folderRepo = folderRepo;
        this.cache = cache;
        this.logger = logger;
        this.prefix = prefix;
    }
    key(type, params) {
        return this.cache.keyBuilder(this.prefix, type, params);
    }
    async invalidateTransparencyCache() {
        await this.cache.invalidatePattern(`${this.prefix}:*`);
    }
    async invalidateFolderCache() {
        await this.cache.del(`${this.prefix}:Folder`);
    }
    // ------------------- WRITES -------------------
    async createTransparency(user, data, fileToUpload) {
        const uploadedFile = await (0, upload_file_1.uploadFile)(collection_name_1.TRANSPARENCY_FOLDER, fileToUpload);
        this.logger.info("File uploaded successfully", uploadedFile);
        const result = await (0, with_rollback_1.withFilesRollback)(uploadedFile.url, () => this.transparencyRepo.create({
            ...data,
            authorId: user.uid,
            file: uploadedFile,
        }));
        this.logger.info("Transparency created successfully", { result });
        await this.invalidateTransparencyCache();
        return result;
    }
    async createTransparencyFolder(user, data) {
        const result = await this.folderRepo.create(data);
        this.logger.info("Folder create successfully", { result });
        await this.invalidateTransparencyCache();
        return result;
    }
    async patchTransparency(id, data, fileToUpload) {
        // 1. upload new file
        const uploadedFile = fileToUpload && (await (0, upload_file_1.uploadFile)(collection_name_1.TRANSPARENCY_FOLDER, fileToUpload));
        // 2. get new file to replace existing file if file has changes only
        const fileURL = uploadedFile && uploadedFile.url;
        // 3. update transparency file if file has changes
        if (uploadedFile) {
            data.file = uploadedFile;
            this.logger.info("File uploaded successfully", { uploadedFile });
        }
        // 4. update transparency
        const result = await (0, with_rollback_1.withFilesRollback)(fileURL, async () => {
            // 1 fetch doc
            const docData = await this.transparencyRepo.getById(id);
            // validation
            if (!docData)
                throw new Error("Document not found");
            // 2. Get file url to delete
            const fileUrl = docData.file.url;
            const { results: deletedFile } = await (0, deleteFile_1.cleanupFiles)(fileUrl);
            this.logger.info("File Deleted", { deletedFile });
            return this.transparencyRepo.update(id, data);
        });
        this.logger.info("Transparency updated succesfully", { result });
        // 5. invalidate cache
        await this.invalidateTransparencyCache();
        // 6. return
        return result;
    }
    async updateTransparencyFolder(id, payload) {
        const result = await this.folderRepo.update(id, payload);
        this.logger.info("Folder updated succesfully", { result });
        await this.invalidateFolderCache();
        return result;
    }
    async deleteTransparency(id) {
        // 1. Fetch docs
        const transparency = await this.transparencyRepo.getById(id);
        // validation
        if (!transparency)
            throw Error("Id not found");
        // 2. Get file url to delete
        const fileUrl = transparency.file.url;
        const { results: deletedFile } = await (0, deleteFile_1.cleanupFiles)(fileUrl);
        this.logger.info("File Deleted", { deletedFile });
        // 3. Delete transparency
        const result = await this.transparencyRepo.delete(id);
        this.logger.info("Transparency deleted successfully", { result });
        await this.invalidateTransparencyCache();
        return result;
    }
    async bulkDeleteTransparency(ids) {
        if (!ids.length)
            return { deletedIds: [], failedIds: [] };
        // 1. Read all docs to get file urls
        const docData = await this.transparencyRepo.getByIds(ids);
        // 2. validation
        if (!docData.length)
            throw new Error("No docs found");
        this.logger.info(`Found transparency docs`, { items: docData.length });
        // 3. Collect only valid file URLs
        const files = docData.map((doc) => doc.file.url).filter((url) => Boolean(url)); // only keep valid strings
        const storageSummary = await (0, deleteFile_1.cleanupFiles)(files);
        this.logger.info("Storage cleanup summary", { storageSummary });
        // 4. Delete files from Firebase Storage
        const { deletedIds, failedIds } = await this.transparencyRepo.bulkDelete(ids);
        if (deletedIds.length > 0)
            this.logger.info(`Docs Delete`, { docsDeleted: deletedIds.length });
        if (failedIds.length > 0) {
            this.logger.error("Bulk delete failed", { failedIds });
            throw new Error(`Failed to delete transparency: ${failedIds.join(", ")}`);
        }
        this.logger.info("Bulk delete success", {
            docsDeleted: deletedIds.length,
            filesDeleted: storageSummary.deleted,
        });
        // 5. Invalidate cache
        await this.invalidateTransparencyCache();
        return { deletedIds, failedIds };
    }
    async deleteTransparencyFolder(id) {
        // 1. fetch all transparency docs in this folder
        const transparency = await this.transparencyRepo.listTransparencyByFolderId(id);
        const transparencyIds = transparency.map((transparency) => transparency.id);
        // 2. bulk delete transparency docs
        const transparencyResult = await this.bulkDeleteTransparency(transparencyIds);
        // 3. delete folder
        await this.folderRepo.delete(id);
        this.logger.info(`Folder deleted successfully`, { folderId: id, transparencyResult });
        // 4. invalidate cache
        await this.invalidateTransparencyCache();
        return;
    }
    // ------------------- READS -------------------
    async getPaginatedTransparency(query) {
        const { page, pageSize, cursor, filters: transparencyFilter } = query;
        const filters = (0, filter_builder_1.filterBuilder)({ ...transparencyFilter });
        const key = this.key("list", { ...query });
        return await this.cache.cacheAside(key, () => this.transparencyRepo.getPaginated({ page, pageSize, cursor, filters }));
    }
    async getTotalTransparencyCount(query) {
        const filters = (0, filter_builder_1.filterBuilder)({ ...query });
        const key = this.key("count", { ...query });
        return await this.cache.cacheAside(key, () => this.transparencyRepo.totalCount(filters));
    }
    async getTransparencyWithFilters(query) {
        const filters = (0, filter_builder_1.filterBuilder)({ ...query });
        const key = this.key("list", { query });
        return await this.cache.cacheAside(key, () => this.transparencyRepo.listAllWithFilters(filters));
    }
    async getPaginatedTransparencyWithCount(query) {
        // 1 Get total transparency count
        const total = await this.getTotalTransparencyCount({ ...query.filters });
        const totalPageCount = Math.ceil(total / query.pageSize);
        this.logger.info("Total page count", { totalResults: total, totalPageCount });
        // 2 Get paginated transparency
        const transparency = await this.getPaginatedTransparency(query);
        return { ...transparency, meta: { totalResults: total, totalPages: totalPageCount } };
    }
    async getTransparencyFolder(query) {
        const filters = (0, filter_builder_1.buildNormalFilters)({ ...query });
        const key = this.key("list", { query });
        const result = await this.cache.cacheAside(key, () => this.folderRepo.listAllWithFilters(filters));
        return result;
    }
    async fetchTransparencyThisYear() {
        const key = this.key("current-year-counts");
        const result = await this.cache.cacheAside(key, () => this.transparencyRepo.getTransparencyCountThisYear());
        return result;
    }
}
exports.TransparencyService = TransparencyService;
exports.transparencyService = new TransparencyService(transparencyRepo, folderRepo, cache_1.cacheService, logger_service_1.logService.withContext("transparency"));
