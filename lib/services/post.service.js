"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const firebase_1 = require("../config/firebase");
const post_repository_1 = require("../repositories/post.repository");
const handler_1 = require("../middleware/handler");
const logger_service_1 = require("./logger.service");
const algolia_search_service_1 = require("./algolia/algolia.search.service");
const cache_1 = require("../utils/cache");
const upload_files_1 = require("../storage/upload.files");
const with_rollback_1 = require("../utils/with.rollback");
const filter_builder_1 = require("../utils/filter.builder");
const errors_1 = require("../errors");
const collection_name_1 = require("../const/collection.name");
const postRepo = new post_repository_1.NewsRepository(firebase_1.db);
class PostService {
    constructor(postRepo, logger, cache, prefix = "post") {
        this.postRepo = postRepo;
        this.logger = logger;
        this.cache = cache;
        this.prefix = prefix;
    }
    key(type, params) {
        return this.cache.keyBuilder(this.prefix, type, params);
    }
    async invalidatePostCache() {
        await this.cache.invalidatePattern(`${this.prefix}:*`);
    }
    // ------------------- WRITES -------------------
    async createPost(user, data, filesToUpload) {
        const uploadUrls = filesToUpload?.length
            ? await (0, handler_1.serviceHandler)("UPLOAD FILES", () => (0, upload_files_1.uploadFiles)(collection_name_1.NEWS_AND_UPDATES_FOLDER, filesToUpload), false)
            : [];
        if (uploadUrls.length)
            this.logger.info("Files uploaded", { files: uploadUrls });
        await (0, handler_1.serviceHandler)("CREATE POST", () => (0, with_rollback_1.withFilesRollback)(uploadUrls, () => this.postRepo.createWithCounters({ ...data, authorId: user.uid, files: uploadUrls })));
        await this.invalidatePostCache();
        return;
    }
    async patchPost(id, data, filesToUpload) {
        // 1. upload files
        const uploadUrls = filesToUpload?.length
            ? await (0, handler_1.serviceHandler)("UPLOAD FILES", () => (0, upload_files_1.uploadFiles)(collection_name_1.NEWS_AND_UPDATES_FOLDER, filesToUpload), false)
            : [];
        // 2. collect all files url with old and new url if file has changes only
        const fileUrls = [...(data.files || []), ...uploadUrls];
        // 3. update post files if file has changes
        if (fileUrls.length) {
            data.files = fileUrls;
            this.logger.info("Files updated", { files: uploadUrls });
        }
        // 4. update post
        await (0, handler_1.serviceHandler)("PATCH POST", () => (0, with_rollback_1.withFilesRollback)(uploadUrls, () => this.postRepo.patchWithCounters(id, data)));
        // 5. invalidate cache
        await this.invalidatePostCache();
        // 6. return
        return;
    }
    async setFeaturedPost(id) {
        const doc = await this.postRepo.getById(id);
        if (!doc)
            throw new errors_1.NotFoundError("Post not found");
        const newIsFeatured = !doc.isFeatured;
        const isPublished = doc.status === "Published";
        // fetch featured post
        const featuredPost = await this.postRepo.featuredPostList();
        // only published posts can be featured
        if (!isPublished && newIsFeatured) {
            throw new errors_1.BadRequestError("Only published posts can be featured");
        }
        // only 2 posts can be featured at a time
        if (featuredPost.length > 2 && newIsFeatured) {
            throw new errors_1.BadRequestError("Only 2 posts can be featured at a time");
        }
        await (0, handler_1.serviceHandler)("PATCH POST", () => this.postRepo.update(id, { isFeatured: newIsFeatured }));
        await this.invalidatePostCache();
        return;
    }
    async deletePost(id) {
        await (0, handler_1.serviceHandler)("DELETE POST", () => this.postRepo.deletePostWithCounters(id));
        await this.invalidatePostCache();
        return;
    }
    async bulkDeletePosts(ids) {
        await (0, handler_1.serviceHandler)("BULK DELETE POSTS", () => this.postRepo.deleteBulkWithCounters(ids));
        await this.invalidatePostCache();
        return;
    }
    // ------------------- READS -------------------
    async getPaginatedPost(query) {
        const { page, pageSize, cursor, filters: filter } = query;
        // Handle filters, if category is latest then remove category filter
        const filters = (0, filter_builder_1.filterBuilder)({ ...filter });
        const key = this.key("list", { ...query });
        return this.cache.cacheAside(key, () => this.postRepo.getPaginated({ page, pageSize, cursor, filters }));
    }
    async getTotalPostCount(filter) {
        // Handle filters, if category is latest then remove category filter
        const filters = (0, filter_builder_1.filterBuilder)({ ...filter });
        const key = this.key("count", { ...filter });
        return this.cache.cacheAside(key, () => this.postRepo.totalCount(filters));
    }
    async getPaginatedPostWithCount(query) {
        const cursor = query.cursor;
        const cursorPage = (cursor && cursor.page) || 1; // if cursor is not provided 1 is default
        const delta = query.page - cursorPage;
        const firestoreJumpLimit = 2;
        const pageJump = delta > firestoreJumpLimit || delta < -firestoreJumpLimit;
        // 2. Get total page count
        const total = await this.getTotalPostCount({ ...query.filters });
        const totalPageCount = Math.ceil(total / query.pageSize);
        this.logger.info("Total page count", { totalResults: total, totalPageCount });
        let post = null;
        // 1. Detect page jump if exceed to firestore jump limit, then use algolia to get post
        if (pageJump) {
            this.logger.info("Using algolia to get post", { query });
            post = await this.getPaginatedPostWithAlgolia(query);
        }
        else {
            this.logger.info("Using firestore to get post", { query });
            post = await this.getPaginatedPost(query);
        }
        // 3. Validate page query if page is greater than total page count
        if (query.page > totalPageCount)
            throw new errors_1.NotFoundError("Page not found", {
                requestedPage: query.page,
                totalPages: totalPageCount,
            });
        // 4. Inject totalResults and totalPages in post
        return { ...post, meta: { ...post.meta, totalResults: total, totalPages: totalPageCount } };
    }
    async getPaginatedPostWithAlgolia(query) {
        // 1. Get post from algolia
        const result = await algolia_search_service_1.searchService.search({
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
        const cursor = {
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
    async getPostById(id) {
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
exports.PostService = PostService;
exports.postService = new PostService(postRepo, logger_service_1.logService.withContext("PostService"), cache_1.cacheService);
