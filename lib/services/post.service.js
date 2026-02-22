"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeaturedPost = exports.getFeaturedPost = exports.getPostCurrentMonthCount = exports.getPostCategoryCount = exports.getPostArchiveCountByMonth = exports.getPostById = exports.getTotalPostCount = exports.getPaginatedPost = exports.getNewsById = exports.bulkDeletePosts = exports.deletePost = exports.patchPost = exports.createPost1 = exports.createPost = void 0;
// src/services/news/news.service.ts
const firebase_1 = require("../config/firebase");
const post_repository_1 = require("../repositories/post.repository");
const upload_files_1 = require("../storage/upload.files");
const deleteFile_1 = require("../storage/deleteFile");
const date_converter_1 = require("../utils/date.converter");
const collection_name_1 = require("../const/collection.name");
const cache_1 = require("../utils/cache");
// helper
const withRollback_1 = require("../utils/withRollback");
const postRepo = new post_repository_1.NewsRepository(firebase_1.db);
const createPost = async (user, data, filesToUpload) => {
    const files = filesToUpload?.length ? await (0, upload_files_1.uploadFiles)(collection_name_1.NEWS_AND_UPDATES_FOLDER, filesToUpload) : [];
    const post = await (0, withRollback_1.withFilesRollback)(files, () => postRepo.createWithCounters({ ...data, authorId: user.uid, files }));
    await cache_1.cacheService.invalidatePattern("post:list:*");
    return post;
};
exports.createPost = createPost;
const createPost1 = async (user, data, filesToUpload) => {
    const files = filesToUpload?.length ? await (0, upload_files_1.uploadFiles)(collection_name_1.NEWS_AND_UPDATES_FOLDER, filesToUpload) : [];
    try {
        const post = await postRepo.createWithCounters({ ...data, authorId: user.uid, files });
        await cache_1.cacheService.invalidatePattern("post:list:*");
        return post;
    }
    catch (error) {
        if (files.length)
            await (0, deleteFile_1.deleteFile)(files);
        throw error;
    }
};
exports.createPost1 = createPost1;
// export const updatePost = async (id: string, data: UpdatePost, filesToUpload: UploadInput[]) => {
//   let uploadUrls: string[] = [];
//   try {
//     if (filesToUpload && filesToUpload.length) {
//       uploadUrls = await uploadFiles(NEWS_AND_UPDATES_FOLDER, filesToUpload);
//     }
//     // combine updated existing url with new urls
//     if (uploadUrls.length) {
//       data.files = [...data.files, ...uploadUrls];
//     }
//     return await postRepo.updateWithCounters(id, data);
//   } catch (error) {
//     if (uploadUrls.length) {
//       deleteFile(uploadUrls);
//     }
//     throw error;
//   }
// };
const patchPost = async (id, data, filesToUpload) => {
    const files = filesToUpload?.length ? await (0, upload_files_1.uploadFiles)(collection_name_1.NEWS_AND_UPDATES_FOLDER, filesToUpload) : [];
    const post = await (0, withRollback_1.withFilesRollback)(files, () => postRepo.patchWithCounters(id, data));
    await cache_1.cacheService.invalidatePattern("post:list:*");
    return post;
};
exports.patchPost = patchPost;
const deletePost = async (id) => {
    await postRepo.deletePostWithCounters(id);
};
exports.deletePost = deletePost;
const bulkDeletePosts = async (ids) => {
    return await postRepo.deleteBulkWithCounters(ids);
};
exports.bulkDeletePosts = bulkDeletePosts;
const getNewsById = async (id) => {
    return await postRepo.getById(id);
};
exports.getNewsById = getNewsById;
const getPaginatedPost = async (query) => {
    const { page, pageSize, category, status, year, month } = query;
    const cacheKey = `post:list:${page}:${pageSize}:${category}:${status}:${year}:${month}`;
    // 1. Check cache first
    const cached = await cache_1.cacheService.get(cacheKey);
    if (cached) {
        console.log("HIT - from Redis ⚡", cached);
        return cached;
    }
    const filters = [];
    if (category && category !== "latest")
        filters.push({ field: "category", op: "==", value: category });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    if (year) {
        // convert year and month to firestore time
        const { start, end } = (0, date_converter_1.getDateRangeForYearOrMonth)(year, month);
        filters.push({ field: "createdAt", op: ">=", value: start });
        filters.push({ field: "createdAt", op: "<=", value: end });
    }
    const result = await postRepo.getPaginated({
        page,
        pageSize,
        filters,
    });
    // 3. Save to cache
    await cache_1.cacheService.set(cacheKey, result);
    return result;
};
exports.getPaginatedPost = getPaginatedPost;
const getTotalPostCount = async (payload) => {
    const { category, status, year, month } = payload;
    const filters = [];
    if (category && category !== "latest")
        filters.push({ field: "category", op: "==", value: category });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    if (year) {
        // convert year and month to firestore time
        const { start, end } = (0, date_converter_1.getDateRangeForYearOrMonth)(year, month);
        filters.push({ field: "createdAt", op: ">=", value: start });
        filters.push({ field: "createdAt", op: "<=", value: end });
    }
    return await postRepo.totalCount();
};
exports.getTotalPostCount = getTotalPostCount;
const getPostById = async (id) => {
    return await postRepo.getById(id);
};
exports.getPostById = getPostById;
const getPostArchiveCountByMonth = async () => {
    return await postRepo.archivePostList();
};
exports.getPostArchiveCountByMonth = getPostArchiveCountByMonth;
const getPostCategoryCount = async () => {
    return await postRepo.categoryList();
};
exports.getPostCategoryCount = getPostCategoryCount;
const getPostCurrentMonthCount = async () => {
    return await postRepo.currentMonthPostCount();
};
exports.getPostCurrentMonthCount = getPostCurrentMonthCount;
const getFeaturedPost = async () => {
    return await postRepo.featuredPostList();
};
exports.getFeaturedPost = getFeaturedPost;
const setFeaturedPost = async (id) => {
    return await postRepo.updateFeaturedPost(id);
};
exports.setFeaturedPost = setFeaturedPost;
