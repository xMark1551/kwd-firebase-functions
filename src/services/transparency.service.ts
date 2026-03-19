import { db } from "../config/firebase";
import { TransparencyRepository } from "../repositories/transaprency.repository";
import { TransparencyFolderRepository } from "../repositories/transparencyFolder.repo";

import { serviceHandler } from "../middleware/handler";

import { CacheService, cacheService } from "../utils/cache";
import { LogService, logService } from "./logger.service";
import { uploadFile } from "../storage/upload.file";
import { filterBuilder, buildNormalFilters } from "../utils/filter.builder";
import { withFilesRollback } from "../utils/with.rollback";
import { cleanupFiles } from "../storage/deleteFile";

import { NotFoundError } from "../errors";

import { TRANSPARENCY_FOLDER } from "../const/collection.name";

import type { AuthedUser } from "../validation/auth.schema";
import type { UploadInput } from "../storage/upload";
import type {
  CreateTransparency,
  CreateTransparencyFolder,
  PatchTransparency,
  PatchTransparencyFolder,
  GetPaginatedTransparency,
  TransparencyFilter,
  GetTransparencyFolderWithFilters,
} from "../validation/transparency.schema";
import type { TransparencySeal } from "../validation/transparency.schema";
import type { PaginatedResult } from "../repositories/base.repository";

type PaginatedResultWithCount = Omit<PaginatedResult<TransparencySeal>, "meta"> & {
  meta: { totalResults: number; totalPages: number };
};

const transparencyRepo = new TransparencyRepository(db);
const folderRepo = new TransparencyFolderRepository(db);

export class TransparencyService {
  constructor(
    private readonly transparencyRepo: TransparencyRepository,
    private readonly folderRepo: TransparencyFolderRepository,
    private readonly cache: CacheService,
    private readonly logger: LogService,
    private readonly prefix = "transparency",
  ) {}

  key(type: string, params?: Record<string, unknown>) {
    return this.cache.keyBuilder(this.prefix, type, params);
  }

  private async invalidateTransparencyCache() {
    await this.cache.invalidatePattern(`${this.prefix}:*`);
  }

  private async invalidateFolderCache() {
    await this.cache.del(`${this.prefix}:Folder`);
  }

  // ------------------- WRITES -------------------
  async createTransparency(user: AuthedUser, data: CreateTransparency, fileToUpload: UploadInput) {
    const uploadedFile = await serviceHandler(
      "UPLOAD_FILE",
      () => uploadFile(TRANSPARENCY_FOLDER, fileToUpload),
      false,
    );

    this.logger.info("File uploaded successfully", uploadedFile);

    await serviceHandler("CREATE_TRANSPARENCY", () =>
      withFilesRollback(uploadedFile.url, () =>
        this.transparencyRepo.create({
          ...data,
          authorId: user.uid,
          file: uploadedFile,
        }),
      ),
    );

    await this.invalidateTransparencyCache();

    return;
  }

  async createTransparencyFolder(data: CreateTransparencyFolder) {
    const result = await serviceHandler("CREATE_TRANSPARENCY_FOLDER", () => this.folderRepo.create(data));

    await this.invalidateTransparencyCache();

    return result;
  }

  async patchTransparency(id: string, data: PatchTransparency, fileToUpload: UploadInput) {
    // 1. upload new file
    const uploadedFile =
      fileToUpload && (await serviceHandler("UPLOAD_FILE", () => uploadFile(TRANSPARENCY_FOLDER, fileToUpload), false));

    // 2. get new file to replace existing file if file has changes only
    const fileURL = uploadedFile && uploadedFile.url;

    // 3. update transparency file if file has changes
    if (uploadedFile) {
      data.file = uploadedFile;
      this.logger.info("File uploaded successfully", { uploadedFile });
    }

    // 4. update transparency
    await serviceHandler("UPDATE_TRANSPARENCY", () =>
      withFilesRollback(fileURL, async () => {
        // 1 fetch doc
        const docData = await this.transparencyRepo.getById(id);

        // validation
        if (!docData) throw new NotFoundError("Document not found");

        // 2. Get file url to delete
        const fileUrl = docData.file.url;
        const { results: deletedFile } = await cleanupFiles(fileUrl);

        this.logger.info("File Deleted", { deletedFile });

        return this.transparencyRepo.update(id, data);
      }),
    );

    // 5. invalidate cache
    await this.invalidateTransparencyCache();

    // 6. return
    return;
  }

  async updateTransparencyFolder(id: string, payload: PatchTransparencyFolder) {
    await serviceHandler("UPDATE_TRANSPARENCY_FOLDER", () => this.folderRepo.update(id, payload));

    await this.invalidateFolderCache();

    return;
  }

  async deleteTransparency(id: string) {
    // 1. Fetch docs
    const transparency = await this.transparencyRepo.getById(id);

    // validation
    if (!transparency) throw new NotFoundError("Id not found");

    // 2. Get file url to delete
    const fileUrl = transparency.file.url;
    const { results: deletedFile } = await cleanupFiles(fileUrl);

    this.logger.info("File Deleted", { deletedFile });

    // 3. Delete transparency
    await serviceHandler("DELETE_TRANSPARENCY", () => this.transparencyRepo.delete(id));

    await this.invalidateTransparencyCache();

    return;
  }

  async bulkDeleteTransparency(ids: string[]) {
    if (!ids.length) return { deletedIds: [], failedIds: [] };

    // 1. Read all docs to get file urls
    const docData = await this.transparencyRepo.getByIds(ids);

    // 2. validation
    if (!docData.length) throw new NotFoundError("No docs found");

    this.logger.info(`Found transparency docs`, { items: docData.length });

    // 3. Collect only valid file URLs
    const files = docData.map((doc) => doc.file.url).filter((url): url is string => Boolean(url)); // only keep valid strings
    const storageSummary = await cleanupFiles(files);

    this.logger.info("Storage cleanup summary", { storageSummary });

    // 4. Delete files from Firebase Storage
    const { deletedIds, failedIds } = await serviceHandler("BULK_DELETE_TRANSPARENCY", () =>
      this.transparencyRepo.bulkDelete(ids),
    );

    if (deletedIds.length > 0) this.logger.info(`Docs Delete`, { docsDeleted: deletedIds.length });

    // 5. Invalidate cache
    await this.invalidateTransparencyCache();

    this.logger.info("Bulk delete success", {
      docsDeleted: deletedIds.length,
      filesDeleted: storageSummary.deleted,
    });

    return { deletedIds, failedIds };
  }

  async deleteTransparencyFolder(id: string) {
    // 1. fetch all transparency docs in this folder
    const folder = await this.folderRepo.getById(id);

    // validation
    if (!folder) throw new NotFoundError("Folder not found");

    const transparency = await this.transparencyRepo.listTransparencyByFolderId(id);
    const transparencyIds = transparency.map((transparency) => transparency.id);

    // 2. bulk delete transparency docs
    await this.bulkDeleteTransparency(transparencyIds);

    // 3. delete folder
    await serviceHandler("DELETE_TRANSPARENCY_FOLDER", () => this.folderRepo.delete(id));

    // 4. invalidate cache
    await this.invalidateTransparencyCache();

    return;
  }

  // ------------------- READS -------------------

  async getPaginatedTransparency(query: GetPaginatedTransparency) {
    const { page, pageSize, cursor, filters: transparencyFilter } = query;

    const filters = filterBuilder({ ...transparencyFilter });

    const key = this.key("list", { ...query });

    return await this.cache.cacheAside(key, () =>
      this.transparencyRepo.getPaginated({ page, pageSize, cursor, filters }),
    );
  }

  async getTotalTransparencyCount(query: TransparencyFilter) {
    const filters = filterBuilder({ ...query });

    const key = this.key("count", { ...query });

    return await this.cache.cacheAside(key, () => this.transparencyRepo.totalCount(filters));
  }

  async getTransparencyWithFilters(query: TransparencyFilter) {
    const filters = filterBuilder({ ...query });

    const key = this.key("list", { query });

    return await this.cache.cacheAside(key, () => this.transparencyRepo.listAllWithFilters(filters));
  }

  async getPaginatedTransparencyWithCount(query: GetPaginatedTransparency): Promise<PaginatedResultWithCount> {
    // 1 Get total transparency count
    const total = await this.getTotalTransparencyCount({ ...query.filters });
    const totalPageCount = Math.ceil(total / query.pageSize);

    this.logger.info("Total page count", { totalResults: total, totalPageCount });

    // 2 Get paginated transparency
    const transparency = await this.getPaginatedTransparency(query);

    return { ...transparency, meta: { totalResults: total, totalPages: totalPageCount } };
  }

  async getTransparencyFolder(query: GetTransparencyFolderWithFilters) {
    const filters = buildNormalFilters({ ...query });

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

export const transparencyService = new TransparencyService(
  transparencyRepo,
  folderRepo,
  cacheService,
  logService.withContext("transparency"),
);
