"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeletePostsController = exports.deletePostController = exports.setFeaturedPostController = exports.patchPostController = exports.getFeaturedPostController = exports.getPostCurrentMonthCountController = exports.getPostCategoryCountController = exports.getPostArchiveCountByMonthController = exports.getPostByIdController = exports.getTotalPostCountController = exports.getPaginatedPostController = exports.createPostController = void 0;
const handler_1 = require("../middleware/handler");
const post_service_1 = require("../services/post.service");
exports.createPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const filesToUpload = req.filesToUpload;
    await (0, post_service_1.createPost)(user, data, filesToUpload);
    res.status(200).json({
        ok: true,
        message: "Post created",
    });
});
exports.getPaginatedPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await (0, post_service_1.getPaginatedPost)(query);
    res.status(200).json({
        ok: true,
        items: response.items,
        meta: response.meta,
    });
});
exports.getTotalPostCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await (0, post_service_1.getTotalPostCount)(query);
    res.status(200).json({ count: response });
});
exports.getPostByIdController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await (0, post_service_1.getPostById)(id);
    res.status(200).json(response);
});
exports.getPostArchiveCountByMonthController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await (0, post_service_1.getPostArchiveCountByMonth)();
    res.status(200).json(response);
});
exports.getPostCategoryCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await (0, post_service_1.getPostCategoryCount)();
    res.status(200).json(response);
});
exports.getPostCurrentMonthCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await (0, post_service_1.getPostCurrentMonthCount)();
    res.status(200).json(response);
});
exports.getFeaturedPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await (0, post_service_1.getFeaturedPost)();
    res.status(200).json(response);
});
exports.patchPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const { id } = req.params;
    const filesToUpload = req.filesToUpload;
    await (0, post_service_1.patchPost)(id, data, filesToUpload);
    res.status(200).json({
        ok: true,
        message: "Update created",
    });
});
exports.setFeaturedPostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await (0, post_service_1.setFeaturedPost)(id);
    res.status(200).json(response);
});
exports.deletePostController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await (0, post_service_1.deletePost)(id);
    res.status(200).json({
        ok: true,
        message: "Post deleted",
    });
});
exports.bulkDeletePostsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    await (0, post_service_1.bulkDeletePosts)(ids);
    res.status(200).json({
        ok: true,
        message: "Post deleted",
    });
});
