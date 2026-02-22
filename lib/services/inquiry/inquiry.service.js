"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadInquiriesCount = exports.getCurrentMonthInquiriesCount = exports.getInquiriesTotalCount = exports.getPaginatedInquiry = exports.bulkDeleteInquiries = exports.deleteInquiry = exports.markAllAsRead = exports.toggleReadStatus = exports.createInquiry = void 0;
const firebase_1 = require("../../config/firebase");
const inquiry_repo_1 = require("../../repositories/inquiry.repo");
const inquiryRepo = new inquiry_repo_1.InquiryRepository(firebase_1.db);
const createInquiry = async (payload) => {
    return inquiryRepo.createInquiry(payload);
};
exports.createInquiry = createInquiry;
const toggleReadStatus = async (id) => {
    return inquiryRepo.toggleReadStatus(id);
};
exports.toggleReadStatus = toggleReadStatus;
const markAllAsRead = async (ids) => {
    return inquiryRepo.markAllAsRead(ids);
};
exports.markAllAsRead = markAllAsRead;
const deleteInquiry = async (id) => {
    return inquiryRepo.deleteInquiry(id);
};
exports.deleteInquiry = deleteInquiry;
const bulkDeleteInquiries = async (ids) => {
    return inquiryRepo.bulkDeleteInquiries(ids);
};
exports.bulkDeleteInquiries = bulkDeleteInquiries;
const getPaginatedInquiry = async (payload) => {
    const { page, pageSize, category, status } = payload;
    const filters = [];
    if (category && category !== "latest")
        filters.push({ field: "category", op: "==", value: category });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    return await inquiryRepo.getPaginated({
        page,
        pageSize,
        filters,
    });
};
exports.getPaginatedInquiry = getPaginatedInquiry;
const getInquiriesTotalCount = async (payload) => {
    const { category, status } = payload;
    const filters = [];
    if (category && category !== "latest")
        filters.push({ field: "category", op: "==", value: category });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    return await inquiryRepo.totalCount(filters);
};
exports.getInquiriesTotalCount = getInquiriesTotalCount;
const getCurrentMonthInquiriesCount = async () => {
    return await inquiryRepo.CurrentMonthInquiryCount();
};
exports.getCurrentMonthInquiriesCount = getCurrentMonthInquiriesCount;
const getUnreadInquiriesCount = async () => {
    return await inquiryRepo.UnreadInquiryCount();
};
exports.getUnreadInquiriesCount = getUnreadInquiriesCount;
