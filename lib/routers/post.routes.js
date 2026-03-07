"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_1 = require("../controller/post");
const auth_1 = require("../middleware/auth");
const multipart_busboy_1 = require("../middleware/multipart.busboy");
const validate_1 = require("../middleware/validate");
const post_schema_1 = require("../validation/post.schema");
const id_schema_1 = require("../validation/id.schema");
const router = (0, express_1.Router)();
// public routes
router.get("/", (0, validate_1.validateQuery)(post_schema_1.getPaginatedPostSchema), post_1.getPaginatedPostController);
router.get("/count", (0, validate_1.validateQuery)(post_schema_1.postFilterSchema), post_1.getTotalPostCountController);
router.get("/archiveCountByMonth", post_1.getPostArchiveCountByMonthController);
router.get("/categoryCount", post_1.getPostCategoryCountController);
router.get("/currentMonthCount", post_1.getPostCurrentMonthCountController);
router.get("/featured", post_1.getFeaturedPostController);
router.get("/:id", (0, validate_1.validateParams)(id_schema_1.idSchema), post_1.getPostByIdController);
// private routes
router.post("/", auth_1.requireAdmin, (0, multipart_busboy_1.multipartBusboy)({
    maxFiles: 50,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg", "video/*"],
}), (0, validate_1.validateBody)(post_schema_1.createPostSchema), post_1.createPostController);
router.patch("/:id", auth_1.requireAdmin, (0, multipart_busboy_1.multipartBusboy)({
    maxFiles: 50,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"],
}), (0, validate_1.validateParams)(id_schema_1.idSchema), (0, validate_1.validateBody)(post_schema_1.patchPostSchema), post_1.patchPostController);
router.patch("/featured/:id", auth_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), post_1.setFeaturedPostController);
router.delete("/bulkDelete", auth_1.requireAdmin, (0, validate_1.validateBody)(id_schema_1.idsSchema), post_1.bulkDeletePostsController);
router.delete("/:id", auth_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), post_1.deletePostController);
exports.default = router;
