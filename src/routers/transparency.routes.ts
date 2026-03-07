import { Router } from "express";
import {
  createTransparencyController,
  createTransparencyFolderController,
  getPaginatedTransparencyController,
  getTotalTransparencyCountController,
  getTransparencyFolderController,
  getTransparencyWithFiltersController,
  patchTransparencyController,
  patchTransparencyFolderController,
  deleteTransparencyController,
  bulkDeleteTransparencyController,
  deleteTransparencyFolderController,
  getTransparencyCountThisYearController,
} from "../controller/transparency";

import { requireAdmin } from "../middleware/middleware";
import { multipartBusboy } from "../middleware/multipart.busboy";
import { validateBody, validateQuery, validateParams } from "../middleware/validate";
import {
  createTransparencySchema,
  createTransparencyFolderSchema,
  patchTransparencySchema,
  patchTransparencyFolderSchema,
  getPaginatedTransparencySchema,
  getTotalTransparencyCountSchema,
  getTransparencyFolder,
  getTransparencyWithFilters,
} from "../validation/transparency.schema";
import { idSchema, idsSchema } from "../validation/id.schema";

const router = Router();

// public routes
router.get("/", validateQuery(getPaginatedTransparencySchema), getPaginatedTransparencyController);
router.get("/count", requireAdmin, validateQuery(getTotalTransparencyCountSchema), getTotalTransparencyCountController);
router.get("/folder", validateQuery(getTransparencyFolder), getTransparencyFolderController);
router.get("/withFilters", validateQuery(getTransparencyWithFilters), getTransparencyWithFiltersController);
router.get("/count-this-year", requireAdmin, getTransparencyCountThisYearController);

// private routes
router.post(
  "/",
  requireAdmin,
  multipartBusboy({
    maxFiles: 1,
    maxFileSizeBytes: 10 * 1024 * 1024, // limit to 10MB
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
  }),
  validateBody(createTransparencySchema),
  createTransparencyController,
);

router.post("/folder", requireAdmin, validateBody(createTransparencyFolderSchema), createTransparencyFolderController);

router.patch(
  "/:id",
  requireAdmin,
  validateParams(idSchema),
  multipartBusboy({
    maxFiles: 50,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
  }),
  validateBody(patchTransparencySchema),
  patchTransparencyController,
);

router.patch(
  "/folder/:id",
  requireAdmin,
  validateParams(idSchema),
  validateBody(patchTransparencyFolderSchema),
  patchTransparencyFolderController,
);

router.delete("/bulkDelete", requireAdmin, validateBody(idsSchema), bulkDeleteTransparencyController);
router.delete("/folder/:id", requireAdmin, validateParams(idSchema), deleteTransparencyFolderController);
router.delete("/:id", requireAdmin, validateParams(idSchema), deleteTransparencyController);

export default router;
