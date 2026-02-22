"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inquiry_1 = require("../controller/inquiry");
const middleware_1 = require("../middleware/middleware");
const multipart_busboy_1 = require("../middleware/multipart.busboy");
const verify_recaptcha_token_1 = require("../middleware/verify.recaptcha.token");
const validate_1 = require("../middleware/validate");
const inquiry_schema_1 = require("../validation/inquiry.schema");
const id_schema_1 = require("../validation/id.schema");
const router = (0, express_1.Router)();
router.post("/", (0, multipart_busboy_1.multipartBusboy)({
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
}), verify_recaptcha_token_1.verifyRecaptchaToken, (0, validate_1.validateBody)(inquiry_schema_1.createInquirySchema), inquiry_1.createInquiryController);
router.get("/", (0, validate_1.validateQuery)(inquiry_schema_1.getPaginatedInquiriesSchema), inquiry_1.getPaginatedInquiryController);
router.get("/count", (0, validate_1.validateQuery)(inquiry_schema_1.getTotalInquiryCount), inquiry_1.getInquiriesTotalCountController);
router.get("/currentMonthCount", inquiry_1.getCurrentMonthInquiriesCountController);
router.get("/unreadCount", inquiry_1.getUnreadInquiriesCountController);
router.patch("/toggleReadStatus/:id", middleware_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), inquiry_1.toggleReadStatusController);
router.patch("/markAllAsRead", middleware_1.requireAdmin, (0, validate_1.validateBody)(id_schema_1.idsSchema), inquiry_1.markAllAsReadController);
router.delete("/bulkDelete", middleware_1.requireAdmin, (0, validate_1.validateBody)(id_schema_1.idsSchema), inquiry_1.bulkDeleteInquiriesController);
router.delete("/:id", middleware_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), middleware_1.requireAdmin, inquiry_1.deleteInquiryController);
exports.default = router;
