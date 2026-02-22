"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeaturedPost = exports.getFeaturedPost = exports.getPostCurrentMonthCount = exports.getPostCategoryCount = exports.getPostArchiveCountByMonth = exports.getTotalPostCount = exports.getPaginatedPost = exports.getNewsById = exports.bulkDeletePosts = exports.deletePost = exports.updatePost = exports.createPost = void 0;
// src/services/news/news.service.ts
const firebase_1 = require("../../config/firebase");
const post_repository_1 = require("../../repositories/post.repository");
function toUploadInput(f) {
    return { filename: f.originalname, data: f.buffer, contentType: f.mimetype };
}
const postRepo = new post_repository_1.NewsRepository(firebase_1.db);
const createPost = async (payload) => {
    return await postRepo.createWithCounters(payload);
};
exports.createPost = createPost;
const updatePost = async (id, payload) => {
    return await postRepo.updateWithCounters(id, payload);
};
exports.updatePost = updatePost;
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
const getPaginatedPost = async (payload) => {
    const { page, pageSize, category, status, year, month } = payload;
    const filters = [];
    if (category && category !== "latest")
        filters.push({ field: "category", op: "==", value: category });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    if (year) {
        // Filter exact month in a year
        const start = month
            ? new Date(year, month - 1, 1) // month is 1-12
            : new Date(year, 0, 1); // Jan 1
        const end = month
            ? new Date(year, month, 1) // next month start
            : new Date(year + 1, 0, 1); // next year start
        filters.push({ field: "createdAt", op: ">=", value: start });
        filters.push({ field: "createdAt", op: "<=", value: end });
    }
    return await postRepo.getPaginated({
        page,
        pageSize,
        filters: [{ field: "status", op: "==", value: "Published" }],
    });
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
        // Filter exact month in a year
        const start = month
            ? new Date(year, month - 1, 1) // month is 1-12
            : new Date(year, 0, 1); // Jan 1
        const end = month
            ? new Date(year, month, 1) // next month start
            : new Date(year + 1, 0, 1); // next year start
        filters.push({ field: "createdAt", op: ">=", value: start });
        filters.push({ field: "createdAt", op: "<=", value: end });
    }
    return await postRepo.totalCount();
};
exports.getTotalPostCount = getTotalPostCount;
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
