"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeaturedPostCallable = exports.getFeaturedPostCallable = exports.getPostCurrentMonthCountCallable = exports.getPostCategoryCountCallable = exports.getPostArchiveCountByMonthCallable = exports.getTotalPostsCallable = exports.getPostsCallable = exports.bulkDeletePostsCallable = exports.deletePostCallable = exports.updatePostCallable = exports.createNewsCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../../utils/auth");
const post_service_1 = require("../../services/post/post.service");
const validation_helper_1 = require("../../utils/validation.helper");
const post_schema_1 = require("../../validation/post.schema");
exports.createNewsCallable = (0, https_1.onCall)(async (request) => {
    const { uid } = (0, auth_1.requireAdmin)(request);
    const data = request.data;
    // validation
    const errors = (0, validation_helper_1.validateForm)({ data, schema: post_schema_1.postSchema });
    if (errors) {
        throw new https_1.HttpsError("invalid-argument", "Missing fields");
    }
    const finalData = {
        ...data,
        authorId: uid,
    };
    return await (0, post_service_1.createPost)(finalData);
});
exports.updatePostCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { id, ...data } = request.data;
    const errors = (0, validation_helper_1.validateForm)({ data, schema: post_schema_1.postUpdatedSchema });
    if (errors) {
        throw new https_1.HttpsError("invalid-argument", "Missing fields");
    }
    return await (0, post_service_1.updatePost)(id, data);
});
exports.deletePostCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const id = request.data;
    return await (0, post_service_1.deletePost)(id);
});
exports.bulkDeletePostsCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const ids = request.data;
    return await (0, post_service_1.bulkDeletePosts)(ids);
});
exports.getPostsCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const res = await (0, post_service_1.getPaginatedPost)(request.data);
    return res.data;
});
exports.getTotalPostsCallable = (0, https_1.onCall)(async (request) => {
    return await (0, post_service_1.getTotalPostCount)(request.data);
});
exports.getPostArchiveCountByMonthCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, post_service_1.getPostArchiveCountByMonth)();
});
exports.getPostCategoryCountCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, post_service_1.getPostCategoryCount)();
});
exports.getPostCurrentMonthCountCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, post_service_1.getPostCurrentMonthCount)();
});
exports.getFeaturedPostCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, post_service_1.getFeaturedPost)();
});
exports.setFeaturedPostCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const id = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Missing id");
    }
    return await (0, post_service_1.setFeaturedPost)(id);
});
