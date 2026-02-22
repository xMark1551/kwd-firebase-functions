"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadInquiriesCountCallable = exports.getCurrentMonthInquiriesCountCallable = exports.getInquiriesTotalCountCallable = exports.getPaginatedInquiryCallable = exports.bulkDeleteInquiriesCallable = exports.deleteInquiryCallable = exports.markAllAsReadCallable = exports.toggleReadStatusCallable = exports.createInquiryCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../../utils/auth");
const inquiry_service_1 = require("../../services/inquiry/inquiry.service");
exports.createInquiryCallable = (0, https_1.onCall)(async (request) => {
    return await (0, inquiry_service_1.createInquiry)(request.data);
});
exports.toggleReadStatusCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, inquiry_service_1.toggleReadStatus)(request.data);
});
exports.markAllAsReadCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, inquiry_service_1.markAllAsRead)(request.data);
});
exports.deleteInquiryCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, inquiry_service_1.deleteInquiry)(request.data);
});
exports.bulkDeleteInquiriesCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, inquiry_service_1.bulkDeleteInquiries)(request.data);
});
exports.getPaginatedInquiryCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const res = await (0, inquiry_service_1.getPaginatedInquiry)(request.data);
    return res.data;
});
exports.getInquiriesTotalCountCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, inquiry_service_1.getInquiriesTotalCount)(request.data);
});
exports.getCurrentMonthInquiriesCountCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const res = await (0, inquiry_service_1.getCurrentMonthInquiriesCount)();
    return res;
});
exports.getUnreadInquiriesCountCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const res = await (0, inquiry_service_1.getUnreadInquiriesCount)();
    console.log("sdfsfd", res);
    return res;
});
