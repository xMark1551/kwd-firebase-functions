"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transparencyService = exports.TransparencyService = void 0;
const firebase_1 = require("../config/firebase");
const transaprency_repository_1 = require("../repositories/transaprency.repository");
const transparencyFolder_repo_1 = require("../repositories/transparencyFolder.repo");
const handler_1 = require("../middleware/handler");
const cache_1 = require("../utils/cache");
const logger_service_1 = require("./logger.service");
const upload_file_1 = require("../storage/upload.file");
const filter_builder_1 = require("../utils/filter.builder");
const with_rollback_1 = require("../utils/with.rollback");
const deleteFile_1 = require("../storage/deleteFile");
const errors_1 = require("../errors");
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
        const uploadedFile = await (0, handler_1.serviceHandler)("UPLOAD_FILE", () => (0, upload_file_1.uploadFile)(collection_name_1.TRANSPARENCY_FOLDER, fileToUpload), false);
        this.logger.info("File uploaded successfully", uploadedFile);
        await (0, handler_1.serviceHandler)("CREATE_TRANSPARENCY", () => (0, with_rollback_1.withFilesRollback)(uploadedFile.url, () => this.transparencyRepo.create({
            ...data,
            authorId: user.uid,
            file: uploadedFile,
        })));
        await this.invalidateTransparencyCache();
        return;
    }
    async createTransparencyFolder(user, data) {
        const result = await (0, handler_1.serviceHandler)("CREATE_TRANSPARENCY_FOLDER", () => this.folderRepo.create(data));
        await this.invalidateTransparencyCache();
        return result;
    }
    async patchTransparency(id, data, fileToUpload) {
        // 1. upload new file
        const uploadedFile = fileToUpload && (await (0, handler_1.serviceHandler)("UPLOAD_FILE", () => (0, upload_file_1.uploadFile)(collection_name_1.TRANSPARENCY_FOLDER, fileToUpload), false));
        // 2. get new file to replace existing file if file has changes only
        const fileURL = uploadedFile && uploadedFile.url;
        // 3. update transparency file if file has changes
        if (uploadedFile) {
            data.file = uploadedFile;
            this.logger.info("File uploaded successfully", { uploadedFile });
        }
        // 4. update transparency
        await (0, handler_1.serviceHandler)("UPDATE_TRANSPARENCY", () => (0, with_rollback_1.withFilesRollback)(fileURL, async () => {
            // 1 fetch doc
            const docData = await this.transparencyRepo.getById(id);
            // validation
            if (!docData)
                throw new errors_1.NotFoundError("Document not found");
            // 2. Get file url to delete
            const fileUrl = docData.file.url;
            const { results: deletedFile } = await (0, deleteFile_1.cleanupFiles)(fileUrl);
            this.logger.info("File Deleted", { deletedFile });
            return this.transparencyRepo.update(id, data);
        }));
        // 5. invalidate cache
        await this.invalidateTransparencyCache();
        // 6. return
        return;
    }
    async updateTransparencyFolder(id, payload) {
        await (0, handler_1.serviceHandler)("UPDATE_TRANSPARENCY_FOLDER", () => this.folderRepo.update(id, payload));
        await this.invalidateFolderCache();
        return;
    }
    async deleteTransparency(id) {
        // 1. Fetch docs
        const transparency = await this.transparencyRepo.getById(id);
        // validation
        if (!transparency)
            throw new errors_1.NotFoundError("Id not found");
        // 2. Get file url to delete
        const fileUrl = transparency.file.url;
        const { results: deletedFile } = await (0, deleteFile_1.cleanupFiles)(fileUrl);
        this.logger.info("File Deleted", { deletedFile });
        // 3. Delete transparency
        await (0, handler_1.serviceHandler)("DELETE_TRANSPARENCY", () => this.transparencyRepo.delete(id));
        await this.invalidateTransparencyCache();
        return;
    }
    async bulkDeleteTransparency(ids) {
        if (!ids.length)
            return { deletedIds: [], failedIds: [] };
        // 1. Read all docs to get file urls
        const docData = await this.transparencyRepo.getByIds(ids);
        // 2. validation
        if (!docData.length)
            throw new errors_1.NotFoundError("No docs found");
        this.logger.info(`Found transparency docs`, { items: docData.length });
        // 3. Collect only valid file URLs
        const files = docData.map((doc) => doc.file.url).filter((url) => Boolean(url)); // only keep valid strings
        const storageSummary = await (0, deleteFile_1.cleanupFiles)(files);
        this.logger.info("Storage cleanup summary", { storageSummary });
        // 4. Delete files from Firebase Storage
        const { deletedIds, failedIds } = await (0, handler_1.serviceHandler)("BULK_DELETE_TRANSPARENCY", () => this.transparencyRepo.bulkDelete(ids));
        if (deletedIds.length > 0)
            this.logger.info(`Docs Delete`, { docsDeleted: deletedIds.length });
        // 5. Invalidate cache
        await this.invalidateTransparencyCache();
        this.logger.info("Bulk delete success", {
            docsDeleted: deletedIds.length,
            filesDeleted: storageSummary.deleted,
        });
        return { deletedIds, failedIds };
    }
    async deleteTransparencyFolder(id) {
        // 1. fetch all transparency docs in this folder
        const folder = await this.folderRepo.getById(id);
        // validation
        if (!folder)
            throw new errors_1.NotFoundError("Folder not found");
        const transparency = await this.transparencyRepo.listTransparencyByFolderId(id);
        const transparencyIds = transparency.map((transparency) => transparency.id);
        // 2. bulk delete transparency docs
        await this.bulkDeleteTransparency(transparencyIds);
        // 3. delete folder
        await (0, handler_1.serviceHandler)("DELETE_TRANSPARENCY_FOLDER", () => this.folderRepo.delete(id));
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
