import { db } from "../config/firebase";
import { InquiryRepository } from "../repositories/inquiry.repo";

import { serviceHandler } from "../middleware/handler";

import { logService, LogService } from "./logger.service";

import { CacheService, cacheService } from "../utils/cache";
import { uploadFile } from "../storage/upload.file";
import { withFilesRollback } from "../utils/with.rollback";
import { sendInquiryEmail } from "../utils/emailHelper";
import { cleanupFiles } from "../storage/deleteFile";

import { NotFoundError } from "../errors";

import { INQUIRY_FOLDER } from "../const/collection.name";

import type { PaginatedResult } from "../repositories/base.repository";
import type { GetPaginatedInquiries, Inquiry } from "@/validation/inquiry.schema";
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
    // 1. upload new file if file provided
    const uploadedFile =
      fileToUpload && (await serviceHandler("UPLOAD_FILE", () => uploadFile(INQUIRY_FOLDER, fileToUpload), false));

    // 2. get file url
    const fileURL = uploadedFile && uploadedFile.url;

    // 3. update file provided
    if (uploadedFile) {
      data.file = uploadedFile;
    }

    // 4. create inquiry
    await serviceHandler("CREATE_INQUIRY", () => withFilesRollback(fileURL, () => this.inquiryRepo.create(data)));

    // 5. send email to admin
    await serviceHandler("SEND_INQUIRY_EMAIL", () =>
      sendInquiryEmail({
        to: "markkings1551@yahoo.com",
        name: data.name,
        email: data.email,
        subject: data.reason,
        message: data.message,
        attachmentUrl: data.file?.url,
      }),
    );

    // 6. invalidate cache
    await this.invalidateInquiryCache();

    // 7. return
    return;
  }

  async toggleReadStatus(id: string): Promise<void> {
    //1. Fetch doc
    const doc = await this.inquiryRepo.getById(id);

    if (!doc) throw new NotFoundError("Document not found");

    //2. Toggle read status
    const newIsRead = !doc.isRead;

    //3. Update Firestore
    await this.inquiryRepo.update(id, { isRead: newIsRead });

    //4. Invalidate cache
    await this.invalidateInquiryCache();

    this.logger.info("Read status updated successfully", { id });

    return;
  }

  async markAllAsRead(ids: string[]): Promise<void> {
    await inquiryRepo.markAllAsRead(ids);

    this.logger.info("Read status updated successfully", { ids });

    await this.invalidateInquiryCache();
    return;
  }

  async deleteInquiry(id: string) {
    // 1. Fetch file url
    const inquiry = await this.inquiryRepo.getById(id);

    if (!inquiry) throw new NotFoundError("Document not found");

    // 2. Get file url and delete
    const fileURL = inquiry.file && inquiry.file.url;

    // 3. Delete file
    if (fileURL) await cleanupFiles(fileURL);

    // 4. Delete inquiry
    await serviceHandler("DELETE_INQUIRY", () => inquiryRepo.delete(id));

    await this.invalidateInquiryCache();

    return;
  }

  async bulkDeleteInquiries(ids: string[]) {
    // 1. fetch all doc data to get file urls
    const docData = await this.inquiryRepo.getByIds(ids);

    // 2. collect only valid file URLs
    const files = docData.map((doc) => doc.file?.url).filter((url): url is string => Boolean(url)); // only keep valid strings
    const { deleted, results } = await cleanupFiles(files);

    this.logger.info("Storage cleanup summary", { deleted, results });

    // 3. delete files from Firebase Storage
    await serviceHandler("BULK_DELETE_INQUIRY", () => this.inquiryRepo.bulkDelete(ids));

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
