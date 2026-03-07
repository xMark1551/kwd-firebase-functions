import { db } from "../config/firebase";
import { InquiryRepository } from "../repositories/inquiry.repo";

import { logService, LogService } from "./logger.service";
import { activityLogService } from "./activity.log.service";

import { CacheService, cacheService } from "../utils/cache";
import { uploadFile } from "../storage/upload.file";
import { withFilesRollback } from "../utils/with.rollback";
import { sendInquiryEmail } from "../utils/emailHelper";
import { cleanupFiles } from "../storage/deleteFile";

import { INQUIRY_FOLDER } from "../const/collection.name";

import type { PaginatedResult } from "../repositories/base.repository";
import type { GetPaginatedInquiries } from "@/validation/inquiry.schema";
import type { Inquiry } from "../model/inquiry.model.schema";
import type { UploadInput } from "../storage/upload";

type PaginatedResultWithCount = Omit<PaginatedResult<Inquiry>, "meta"> & {
  meta: { totalResults: number; totalPages: number };
};

const inquiryRepo = new InquiryRepository(db);

export class InquiryService {
  constructor(
    private readonly inquiryRepo: InquiryRepository,
    private readonly logger: LogService,
    private readonly cache: CacheService,
    private readonly prefix = "inquiry",
  ) {}

  key(type: string, params?: Record<string, unknown>) {
    return this.cache.keyBuilder(this.prefix, type, params);
  }

  private async invalidateInquiryCache() {
    await this.cache.invalidatePattern(`${this.prefix}:list:*`);
    await this.cache.invalidatePattern(`${this.prefix}:count:*`);
  }

  async createInquiry(data: Inquiry, fileToUpload: UploadInput) {
    console.log("data", data);
    // 1. upload new file if file provided
    const uploadedFile = fileToUpload && (await uploadFile(INQUIRY_FOLDER, fileToUpload));

    // 2. get file url
    const fileURL = uploadedFile && uploadedFile.url;

    // 3. update file provided has been uploaded
    if (uploadedFile) {
      data.file = uploadedFile;
      this.logger.info("File uploaded", uploadedFile);
    }

    // 4. create inquiry
    const result = await withFilesRollback(fileURL, () => this.inquiryRepo.create(data));

    // 5. create activity log
    await activityLogService.info("CREATE_INQUIRY", `Inquiry created by ${data.name}`, data);

    this.logger.info("Inquiry created successfully", { result });

    // 5. send email to admin
    await sendInquiryEmail({
      to: "markkings1551@yahoo.com",
      name: data.name,
      subject: data.reason,
      message: data.message,
      attachmentUrl: data.file?.url,
    });

    this.logger.info("Email sent successfully");

    // 6. invalidate cache
    await this.invalidateInquiryCache();

    // 7. return
    return result;
  }

  async toggleReadStatus(id: string): Promise<void> {
    const result = await inquiryRepo.toggleReadStatus(id);

    this.logger.info("Read status updated successfully", { id });

    await this.invalidateInquiryCache();
    return result;
  }

  async markAllAsRead(ids: string[]): Promise<void> {
    const result = await inquiryRepo.markAllAsRead(ids);

    this.logger.info("Read status updated successfully", { ids });

    await this.invalidateInquiryCache();
    return result;
  }

  async deleteInquiry(id: string): Promise<void> {
    // 1. Fetch file url
    const inquiry = await this.inquiryRepo.getById(id);

    if (!inquiry) throw new Error("Document not found");

    // 2. Get file url and delete
    const fileURL = inquiry.file && inquiry.file.url;
    if (fileURL) {
      const { results } = await cleanupFiles(fileURL);
      this.logger.info("File Deleted", { results });
    }

    // 3. Delete inquiry
    const result = await inquiryRepo.delete(id);

    this.logger.info("Inquiry deleted successfully", { id });

    await this.invalidateInquiryCache();

    return result;
  }

  async bulkDeleteInquiries(ids: string[]): Promise<void> {
    // 1. fetch all doc data to get file urls
    const docData = await this.inquiryRepo.getByIds(ids);

    // 2. collect only valid file URLs
    const files = docData.map((doc) => doc.file?.url).filter((url): url is string => Boolean(url)); // only keep valid strings
    const { deleted, results } = await cleanupFiles(files);

    this.logger.info("Storage cleanup summary", { deleted, results });

    // 3. delete files from Firebase Storage
    await this.inquiryRepo.bulkDelete(ids);

    this.logger.info("Inquiries deleted", { ids });

    await this.invalidateInquiryCache();

    return;
  }

  async getPaginatedInquiry(query: GetPaginatedInquiries) {
    const { page, pageSize, cursor } = query;

    const key = this.key("list", { ...query });

    return await this.cache.cacheAside(key, () => inquiryRepo.getPaginated({ page, pageSize, cursor }));
  }

  async getInquiriesTotalCount() {
    const key = this.key("count");

    return await this.cache.cacheAside(key, () => inquiryRepo.totalCount());
  }

  async getPaginatedInquiriesWithTotalCount(query: GetPaginatedInquiries): Promise<PaginatedResultWithCount> {
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

export const inquiryService = new InquiryService(inquiryRepo, logService.withContext("inquiry"), cacheService);
