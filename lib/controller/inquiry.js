"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteInquiriesController = exports.deleteInquiryController = exports.markAllAsReadController = exports.toggleReadStatusController = exports.getUnreadInquiriesCountController = exports.getCurrentMonthInquiriesCountController = exports.getInquiriesTotalCountController = exports.getPaginatedInquiryController = exports.createInquiryController = void 0;
const handler_1 = require("../middleware/handler");
const inquiry_service_1 = require("../services/inquiry.service");
exports.createInquiryController = (0, handler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const fileToUpload = req.filesToUpload[0];
    await inquiry_service_1.inquiryService.createInquiry(data, fileToUpload);
    res.status(200).json({
        ok: true,
        message: "Inquiry created",
    });
});
exports.getPaginatedInquiryController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await inquiry_service_1.inquiryService.getPaginatedInquiriesWithTotalCount(query);
    res.status(200).json({
        ok: true,
        items: response.items,
        meta: response.meta,
        nextCursor: response.nextCursor,
    });
});
exports.getInquiriesTotalCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await inquiry_service_1.inquiryService.getInquiriesTotalCount();
    res.status(200).json({ count: response });
});
exports.getCurrentMonthInquiriesCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await inquiry_service_1.inquiryService.getCurrentMonthInquiriesCount();
    res.status(200).json(response);
});
exports.getUnreadInquiriesCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await inquiry_service_1.inquiryService.getUnreadInquiriesCount();
    res.status(200).json(response);
});
exports.toggleReadStatusController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await inquiry_service_1.inquiryService.toggleReadStatus(id);
    res.status(200).json({
        ok: true,
    });
});
exports.markAllAsReadController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    await inquiry_service_1.inquiryService.markAllAsRead(ids);
    res.status(200).json({
        ok: true,
    });
});
exports.deleteInquiryController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await inquiry_service_1.inquiryService.deleteInquiry(id);
    res.status(200).json({
        ok: true,
    });
});
exports.bulkDeleteInquiriesController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    await inquiry_service_1.inquiryService.bulkDeleteInquiries(ids);
    res.status(200).json({
        ok: true,
    });
});
