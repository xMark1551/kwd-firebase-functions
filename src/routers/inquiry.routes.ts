import { Router } from "express";
import {
  createInquiryController,
  getPaginatedInquiryController,
  getInquiriesTotalCountController,
  getCurrentMonthInquiriesCountController,
  getUnreadInquiriesCountController,
  toggleReadStatusController,
  markAllAsReadController,
  deleteInquiryController,
  bulkDeleteInquiriesController,
} from "../controller/inquiry";

import { requireAdmin } from "../middleware/auth";
import { multipartBusboy } from "../middleware/multipart.busboy";
import { verifyRecaptchaToken } from "../middleware/verify.recaptcha.token";
import { validateBody, validateQuery, validateParams } from "../middleware/validate";
import { createInquirySchema, getPaginatedInquiriesSchema, getTotalInquiryCount } from "../validation/inquiry.schema";
import { idSchema, idsSchema } from "../validation/id.schema";

import { contactLimiter } from "../middleware/rate-limiter";

const router = Router();

router.post(
  "/",
  contactLimiter,
  multipartBusboy({
    maxFiles: 1,
    maxFileSizeBytes: 5 * 1024 * 1024, // limit to 5MB
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  }),
  verifyRecaptchaToken,
  validateBody(createInquirySchema),
  createInquiryController,
);

router.get("/", validateQuery(getPaginatedInquiriesSchema), getPaginatedInquiryController);
router.get("/count", validateQuery(getTotalInquiryCount), getInquiriesTotalCountController);
router.get("/currentMonthCount", getCurrentMonthInquiriesCountController);
router.get("/unreadCount", getUnreadInquiriesCountController);

router.patch("/toggleReadStatus/:id", requireAdmin, validateParams(idSchema), toggleReadStatusController);
router.patch("/markAllAsRead", requireAdmin, validateBody(idsSchema), markAllAsReadController);

router.delete("/bulkDelete", requireAdmin, validateBody(idsSchema), bulkDeleteInquiriesController);
router.delete("/:id", requireAdmin, validateParams(idSchema), requireAdmin, deleteInquiryController);

export default router;
