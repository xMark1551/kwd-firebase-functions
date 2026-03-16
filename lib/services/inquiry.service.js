"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryService = exports.InquiryService = void 0;
const firebase_1 = require("../config/firebase");
const inquiry_repo_1 = require("../repositories/inquiry.repo");
const handler_1 = require("../middleware/handler");
const logger_service_1 = require("./logger.service");
const cache_1 = require("../utils/cache");
const upload_file_1 = require("../storage/upload.file");
const with_rollback_1 = require("../utils/with.rollback");
const emailHelper_1 = require("../utils/emailHelper");
const deleteFile_1 = require("../storage/deleteFile");
const errors_1 = require("../errors");
const collection_name_1 = require("../const/collection.name");
const inquiryRepo = new inquiry_repo_1.InquiryRepository(firebase_1.db);
class InquiryService {
    constructor(inquiryRepo, logger, cache, prefix = "inquiry") {
        this.inquiryRepo = inquiryRepo;
        this.logger = logger;
        this.cache = cache;
        this.prefix = prefix;
    }
    key(type, params) {
        return this.cache.keyBuilder(this.prefix, type, params);
    }
    async invalidateInquiryCache() {
        await this.cache.invalidatePattern(`${this.prefix}:list:*`);
        await this.cache.invalidatePattern(`${this.prefix}:count:*`);
    }
    async createInquiry(data, fileToUpload) {
        // 1. upload new file if file provided
        const uploadedFile = fileToUpload && (await (0, handler_1.serviceHandler)("UPLOAD_FILE", () => (0, upload_file_1.uploadFile)(collection_name_1.INQUIRY_FOLDER, fileToUpload), false));
        // 2. get file url
        const fileURL = uploadedFile && uploadedFile.url;
        // 3. update file provided
        if (uploadedFile) {
            data.file = uploadedFile;
        }
        // 4. create inquiry
        await (0, handler_1.serviceHandler)("CREATE_INQUIRY", () => (0, with_rollback_1.withFilesRollback)(fileURL, () => this.inquiryRepo.create(data)));
        // 5. send email to admin
        await (0, handler_1.serviceHandler)("SEND_INQUIRY_EMAIL", () => (0, emailHelper_1.sendInquiryEmail)({
            to: "markkings1551@yahoo.com",
            name: data.name,
            email: data.email,
            subject: data.reason,
            message: data.message,
            attachmentUrl: data.file?.url,
        }));
        // 6. invalidate cache
        await this.invalidateInquiryCache();
        // 7. return
        return;
    }
    async toggleReadStatus(id) {
        //1. Fetch doc
        const doc = await this.inquiryRepo.getById(id);
        if (!doc)
            throw new errors_1.NotFoundError("Document not found");
        //2. Toggle read status
        const newIsRead = !doc.isRead;
        //3. Update Firestore
        await this.inquiryRepo.update(id, { isRead: newIsRead });
        //4. Invalidate cache
        await this.invalidateInquiryCache();
        this.logger.info("Read status updated successfully", { id });
        return;
    }
    async markAllAsRead(ids) {
        await inquiryRepo.markAllAsRead(ids);
        this.logger.info("Read status updated successfully", { ids });
        await this.invalidateInquiryCache();
        return;
    }
    async deleteInquiry(id) {
        // 1. Fetch file url
        const inquiry = await this.inquiryRepo.getById(id);
        if (!inquiry)
            throw new errors_1.NotFoundError("Document not found");
        // 2. Get file url and delete
        const fileURL = inquiry.file && inquiry.file.url;
        // 3. Delete file
        if (fileURL)
            await (0, deleteFile_1.cleanupFiles)(fileURL);
        // 4. Delete inquiry
        await (0, handler_1.serviceHandler)("DELETE_INQUIRY", () => inquiryRepo.delete(id));
        await this.invalidateInquiryCache();
        return;
    }
    async bulkDeleteInquiries(ids) {
        // 1. fetch all doc data to get file urls
        const docData = await this.inquiryRepo.getByIds(ids);
        // 2. collect only valid file URLs
        const files = docData.map((doc) => doc.file?.url).filter((url) => Boolean(url)); // only keep valid strings
        const { deleted, results } = await (0, deleteFile_1.cleanupFiles)(files);
        this.logger.info("Storage cleanup summary", { deleted, results });
        // 3. delete files from Firebase Storage
        await (0, handler_1.serviceHandler)("BULK_DELETE_INQUIRY", () => this.inquiryRepo.bulkDelete(ids));
        await this.invalidateInquiryCache();
        return;
    }
    async getPaginatedInquiry(query) {
        const { page, pageSize, cursor } = query;
        const key = this.key("list", { ...query });
        return await this.cache.cacheAside(key, () => inquiryRepo.getPaginated({ page, pageSize, cursor }));
    }
    async getInquiriesTotalCount() {
        const key = this.key("count");
        return await this.cache.cacheAside(key, () => inquiryRepo.totalCount());
    }
    async getPaginatedInquiriesWithTotalCount(query) {
        // 1. Fetch count
        const total = await this.getInquiriesTotalCount();
        const totalPageCount = Math.ceil(total / query.pageSize);
        this.logger.info("Total page count", { totalResults: total, totalPageCount });
        // 2. Get paginated inquiries
        const inquiries = await this.getPaginatedInquiry(query);
        return { ...inquiries, meta: { totalResults: total, totalPages: totalPageCount } };
    }
    async getCurrentMonthInquiriesCount() {
        const key = this.key("current-month-counts");
        return await this.cache.cacheAside(key, () => inquiryRepo.CurrentMonthInquiryCount());
    }
    async getUnreadInquiriesCount() {
        const key = this.key("unread-counts");
        return await this.cache.cacheAside(key, () => inquiryRepo.UnreadInquiryCount());
    }
}
exports.InquiryService = InquiryService;
exports.inquiryService = new InquiryService(inquiryRepo, logger_service_1.logService.withContext("inquiry"), cache_1.cacheService);
