"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeletePostsController = exports.deletePostController = exports.setFeaturedPostController = exports.patchPostController = exports.getFeaturedPostController = exports.getPostCurrentMonthCountController = exports.getPostCategoryCountController = exports.getPostArchiveCountByMonthController = exports.getPostByIdController = exports.getTotalPostCountController = exports.getPaginatedPostController = exports.createPostController = void 0;
const handler_1 = require("../middleware/handler");
const reponse_1 = require("../utils/reponse");
const post_service_1 = require("../services/post.service");
exports.createPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const filesToUpload = req.filesToUpload;
    const reponse = await post_service_1.postService.createPost(user, data, filesToUpload);
    (0, reponse_1.ok)(res, reponse, "Post created");
});
exports.getPaginatedPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await post_service_1.postService.getPaginatedPostWithCount(query);
    (0, reponse_1.ok)(res, response, "Post fetched");
});
exports.getTotalPostCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await post_service_1.postService.getTotalPostCount(query);
    (0, reponse_1.ok)(res, response, "Post count fetched");
});
exports.getPostByIdController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await post_service_1.postService.getPostById(id);
    (0, reponse_1.ok)(res, response, "Post fetched");
});
exports.getPostArchiveCountByMonthController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await post_service_1.postService.getPostArchiveCountByMonth();
    (0, reponse_1.ok)(res, response, "Post archive count fetched");
});
exports.getPostCategoryCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await post_service_1.postService.getPostCategoryCount();
    (0, reponse_1.ok)(res, response, "Post category count fetched");
});
exports.getPostCurrentMonthCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await post_service_1.postService.getPostCurrentMonthCount();
    (0, reponse_1.ok)(res, response, "Post current month count fetched");
});
exports.getFeaturedPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await post_service_1.postService.getFeaturedPost();
    (0, reponse_1.ok)(res, response, "Featured post fetched");
});
exports.patchPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const { id } = req.params;
    const filesToUpload = req.filesToUpload;
    const response = await post_service_1.postService.patchPost(id, data, filesToUpload);
    (0, reponse_1.ok)(res, response, "Post updated");
});
exports.setFeaturedPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await post_service_1.postService.setFeaturedPost(id);
    (0, reponse_1.ok)(res, response, "Post featured updated");
});
exports.deletePostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await post_service_1.postService.deletePost(id);
    (0, reponse_1.ok)(res, response, "Post deleted");
});
exports.bulkDeletePostsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    const response = await post_service_1.postService.bulkDeletePosts(ids);
    (0, reponse_1.ok)(res, response, "Posts deleted");
});
