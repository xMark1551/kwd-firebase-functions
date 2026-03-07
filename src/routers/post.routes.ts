import { Router } from "express";
import {
  createPostController,
  getPaginatedPostController,
  getTotalPostCountController,
  getPostByIdController,
  getPostArchiveCountByMonthController,
  getPostCategoryCountController,
  getPostCurrentMonthCountController,
  getFeaturedPostController,
  patchPostController,
  setFeaturedPostController,
  deletePostController,
  bulkDeletePostsController,
} from "../controller/post";

import { requireAdmin } from "../middleware/auth";
import { multipartBusboy } from "../middleware/multipart.busboy";

import { validateParams, validateQuery, validateBody } from "../middleware/validate";
import { createPostSchema, patchPostSchema, getPaginatedPostSchema, postFilterSchema } from "../validation/post.schema";
import { idSchema, idsSchema } from "../validation/id.schema";

const router = Router();

// public routes
router.get("/", validateQuery(getPaginatedPostSchema), getPaginatedPostController);
router.get("/count", validateQuery(postFilterSchema), getTotalPostCountController);
router.get("/archiveCountByMonth", getPostArchiveCountByMonthController);
router.get("/categoryCount", getPostCategoryCountController);
router.get("/currentMonthCount", getPostCurrentMonthCountController);
router.get("/featured", getFeaturedPostController);
router.get("/:id", validateParams(idSchema), getPostByIdController);

// private routes
router.post(
  "/",
  requireAdmin,
  multipartBusboy({
    maxFiles: 50,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg", "video/*"],
  }),
  validateBody(createPostSchema),
  createPostController,
);

router.patch(
  "/:id",
  requireAdmin,
  multipartBusboy({
    maxFiles: 50,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"],
  }),
  validateParams(idSchema),
  validateBody(patchPostSchema),
  patchPostController,
);

router.patch("/featured/:id", requireAdmin, validateParams(idSchema), setFeaturedPostController);

router.delete("/bulkDelete", requireAdmin, validateBody(idsSchema), bulkDeletePostsController);
router.delete("/:id", requireAdmin, validateParams(idSchema), deletePostController);

export default router;
