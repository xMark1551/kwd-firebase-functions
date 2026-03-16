import { db } from "../config/firebase";
import { NewsRepository } from "../repositories/post.repository";

import { serviceHandler } from "../middleware/handler";

import { LogService, logService } from "./logger.service";
import { searchService } from "./algolia/algolia.search.service";

import { CacheService, cacheService } from "../utils/cache";

import { uploadFiles } from "../storage/upload.files";
import { withFilesRollback } from "../utils/with.rollback";
import { filterBuilder } from "../utils/filter.builder";

import { NotFoundError, BadRequestError } from "../errors";

import { NEWS_AND_UPDATES_FOLDER } from "../const/collection.name";

import type { AuthedUser } from "../model/auth.model.schema";
import type { GetPaginatedPostQuery } from "../validation/post.schema";
import type { CreatePost, PatchPost, PostFilter } from "../validation/post.schema";
import type { UploadInput } from "../storage/upload";
import type { PaginatedResult } from "../repositories/base.repository";
import type { Post } from "../model/post.model.schema";
import { PageCursor } from "../repositories/base.repository";

type PaginatedResultWithCount = Omit<PaginatedResult<Post>, "meta"> & {
  meta: { totalResults: number; totalPages: number };
};

const postRepo = new NewsRepository(db);

export class PostService {
  constructor(
    private readonly postRepo: NewsRepository,
    private readonly logger: LogService,
    private readonly cache: CacheService,
    private readonly prefix = "post",
  ) {}

  private key(type: string, params?: Record<string, unknown>) {
    return this.cache.keyBuilder(this.prefix, type, params);
  }

  private async invalidatePostCache() {
    await this.cache.invalidatePattern(`${this.prefix}:*`);
  }

  // ------------------- WRITES -------------------

  async createPost(user: AuthedUser, data: CreatePost, filesToUpload: UploadInput[]) {
    const uploadUrls = filesToUpload?.length
      ? await serviceHandler("UPLOAD FILES", () => uploadFiles(NEWS_AND_UPDATES_FOLDER, filesToUpload), false)
      : [];

    if (uploadUrls.length) this.logger.info("Files uploaded", { files: uploadUrls });

    await serviceHandler("CREATE POST", () =>
      withFilesRollback(uploadUrls, () =>
        this.postRepo.createWithCounters({ ...data, authorId: user.uid, files: uploadUrls }),
      ),
    );

    await this.invalidatePostCache();

    return;
  }

  async patchPost(id: string, data: PatchPost, filesToUpload: UploadInput[]) {
    // 1. upload files
    const uploadUrls = filesToUpload?.length
      ? await serviceHandler("UPLOAD FILES", () => uploadFiles(NEWS_AND_UPDATES_FOLDER, filesToUpload), false)
      : [];

    // 2. collect all files url with old and new url if file has changes only
    const fileUrls = [...(data.files || []), ...uploadUrls];

    // 3. update post files if file has changes
    if (fileUrls.length) {
      data.files = fileUrls;
      this.logger.info("Files updated", { files: uploadUrls });
    }

    // 4. update post
    await serviceHandler("PATCH POST", () =>
      withFilesRollback(uploadUrls, () => this.postRepo.patchWithCounters(id, data)),
    );

    // 5. invalidate cache
    await this.invalidatePostCache();

    // 6. return
    return;
  }

  async setFeaturedPost(id: string) {
    const doc = await this.postRepo.getById(id);

    if (!doc) throw new NotFoundError("Post not found");

    const newIsFeatured = !doc.isFeatured;
    const isPublished = doc.status === "Published";

    // fetch featured post
    const featuredPost = await this.postRepo.featuredPostList();

    // only published posts can be featured
    if (!isPublished && newIsFeatured) {
      throw new BadRequestError("Only published posts can be featured");
    }

    // only 2 posts can be featured at a time
    if (featuredPost.length > 2 && newIsFeatured) {
      throw new BadRequestError("Only 2 posts can be featured at a time");
    }

    await serviceHandler("PATCH POST", () => this.postRepo.update(id, { isFeatured: newIsFeatured }));

    await this.invalidatePostCache();

    return;
  }

  async deletePost(id: string) {
    await serviceHandler("DELETE POST", () => this.postRepo.deletePostWithCounters(id));

    await this.invalidatePostCache();

    return;
  }

  async bulkDeletePosts(ids: string[]) {
    await serviceHandler("BULK DELETE POSTS", () => this.postRepo.deleteBulkWithCounters(ids));

    await this.invalidatePostCache();

    return;
  }

  // ------------------- READS -------------------

  async getPaginatedPost(query: GetPaginatedPostQuery) {
    const { page, pageSize, cursor, filters: filter } = query;

    // Handle filters, if category is latest then remove category filter
    const filters = filterBuilder({ ...filter });

    const key = this.key("list", { ...query });

    return this.cache.cacheAside(key, () => this.postRepo.getPaginated({ page, pageSize, cursor, filters }));
  }

  async getTotalPostCount(filter: PostFilter) {
    // Handle filters, if category is latest then remove category filter
    const filters = filterBuilder({ ...filter });

    const key = this.key("count", { ...filter });

    return this.cache.cacheAside(key, () => this.postRepo.totalCount(filters));
  }

  async getPaginatedPostWithCount(query: GetPaginatedPostQuery): Promise<PaginatedResultWithCount> {
    const cursor = query.cursor;
    const cursorPage = (cursor && cursor.page) || 1; // if cursor is not provided 1 is default
    const delta = query.page - cursorPage;
    const firestoreJumpLimit = 2;
    const pageJump = delta > firestoreJumpLimit || delta < -firestoreJumpLimit;

    // 2. Get total page count
    const total = await this.getTotalPostCount({ ...query.filters });
    const totalPageCount = Math.ceil(total / query.pageSize);

    this.logger.info("Total page count", { totalResults: total, totalPageCount });

    let post: PaginatedResult<Post> | null = null;

    // 1. Detect page jump if exceed to firestore jump limit, then use algolia to get post
    if (pageJump) {
      this.logger.info("Using algolia to get post", { query });
      post = await this.getPaginatedPostWithAlgolia(query);
    } else {
      this.logger.info("Using firestore to get post", { query });
      post = await this.getPaginatedPost(query);
    }

    // 3. Validate page query if page is greater than total page count
    if (query.page > totalPageCount)
      throw new NotFoundError("Page not found", {
        requestedPage: query.page,
        totalPages: totalPageCount,
      });

    // 4. Inject totalResults and totalPages in post
    return { ...post, meta: { ...post.meta, totalResults: total, totalPages: totalPageCount } };
  }

  async getPaginatedPostWithAlgolia(query: GetPaginatedPostQuery): Promise<PaginatedResult<Post>> {
    // 1. Get post from algolia
    const result = await searchService.search({
      query: "",
      page: query.page,
      limit: query.pageSize,
      category: query.filters && query.filters.category === "latest" ? "" : query.filters && query.filters.category,
      sources: ["news_and_updates"],
    });

    this.logger.info("Algolia search page result done", result);

    // 2. Collect all post id from algolia result and get from firestore for more accurate
    const postIds = result && result.items && result.items.map((item) => item.objectID);
    const currentPost = await this.postRepo.getByIds(postIds);

    // 3. Get cursor
    const last = currentPost[currentPost.length - 1];
    const first = currentPost[0];
    const lastCreatedAt = last.createdAt;
    const firstCreatedAt = first.createdAt;

    // 4. Build cursor
    const cursor: PageCursor = {
      page: query.page,
      limit: query.pageSize,
      lastCreatedAt: lastCreatedAt,
      lastId: last.id,
      firstCreatedAt: firstCreatedAt,
      firstId: first.id,
    };

    // 5. Return
    return {
      items: currentPost,
      meta: {
        currentPage: query.page,
        pageSize: query.pageSize,
      },
      nextCursor: cursor,
    };
  }

  async getPostById(id: string) {
    const key = this.key(id);

    return this.cache.cacheAside(key, () => this.postRepo.getById(id));
  }

  async getPostArchiveCountByMonth() {
    const key = this.key("archive");

    return this.cache.cacheAside(key, () => this.postRepo.getPostArchiveCountByMonth());
  }

  async getPostCategoryCount() {
    const key = this.key("category-counts");

    return this.cache.cacheAside(key, () => this.postRepo.getPostCategoryCount());
  }

  async getPostCurrentMonthCount() {
    const key = this.key("current-month-counts");

    return this.cache.cacheAside(key, () => this.postRepo.getCurrentMonthPostCount());
  }

  async getFeaturedPost() {
    const key = this.key("featured-post");

    return this.cache.cacheAside(key, () => this.postRepo.featuredPostList());
  }
}

export const postService = new PostService(postRepo, logService.withContext("PostService"), cacheService);
