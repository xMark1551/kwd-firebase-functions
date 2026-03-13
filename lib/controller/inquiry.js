"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteInquiriesController = exports.deleteInquiryController = exports.markAllAsReadController = exports.toggleReadStatusController = exports.getUnreadInquiriesCountController = exports.getCurrentMonthInquiriesCountController = exports.getInquiriesTotalCountController = exports.getPaginatedInquiryController = exports.createInquiryController = void 0;
const handler_1 = require("../middleware/handler");
const reponse_1 = require("../utils/reponse");
const inquiry_service_1 = require("../services/inquiry.service");
exports.createInquiryController = (0, handler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const fileToUpload = req.filesToUpload[0];
    const response = await inquiry_service_1.inquiryService.createInquiry(data, fileToUpload);
    (0, reponse_1.ok)(res, response, "Inquiry created");
});
exports.getPaginatedInquiryController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await inquiry_service_1.inquiryService.getPaginatedInquiriesWithTotalCount(query);
    (0, reponse_1.ok)(res, response, "Inquiries fetched");
});
exports.getInquiriesTotalCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await inquiry_service_1.inquiryService.getInquiriesTotalCount();
    (0, reponse_1.ok)(res, { count: response }, "Inquiries total count fetched");
});
exports.getCurrentMonthInquiriesCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await inquiry_service_1.inquiryService.getCurrentMonthInquiriesCount();
    (0, reponse_1.ok)(res, response, "Inquiries current month count fetched");
});
exports.getUnreadInquiriesCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await inquiry_service_1.inquiryService.getUnreadInquiriesCount();
    (0, reponse_1.ok)(res, response, "Inquiries unread count fetched");
});
exports.toggleReadStatusController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await inquiry_service_1.inquiryService.toggleReadStatus(id);
    (0, reponse_1.ok)(res, response, "Inquiry read status updated");
});
exports.markAllAsReadController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    const response = await inquiry_service_1.inquiryService.markAllAsRead(ids);
    (0, reponse_1.ok)(res, response, "Inquiries marked as read");
});
exports.deleteInquiryController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await inquiry_service_1.inquiryService.deleteInquiry(id);
    (0, reponse_1.ok)(res, response, "Inquiry deleted");
});
exports.bulkDeleteInquiriesController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    const response = await inquiry_service_1.inquiryService.bulkDeleteInquiries(ids);
    (0, reponse_1.ok)(res, response, "Inquiries bulk deleted");
});
