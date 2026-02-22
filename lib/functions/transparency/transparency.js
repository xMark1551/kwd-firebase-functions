"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransparencyWithFiltersCallable = exports.getTransparencyFolderCallable = exports.getTotalTransparencyCountCallable = exports.getPaginatedTransparencyCallable = exports.deleteTransparencyFolderCallable = exports.bulkDeleteTransparencyCallable = exports.deleteTransparencyCallable = exports.updateTransparencyFolderCallable = exports.updateTransparencyCallable = exports.createTransparencyFolderCallable = exports.createTransparencyCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../../utils/auth");
const transparency_service_1 = require("../../services/transparency/transparency.service");
exports.createTransparencyCallable = (0, https_1.onCall)(async (request) => {
    const { uid } = (0, auth_1.requireAdmin)(request);
    const data = request.data;
    const finalData = {
        ...data,
        authorId: uid,
    };
    return await (0, transparency_service_1.createTransparency)(finalData);
});
exports.createTransparencyFolderCallable = (0, https_1.onCall)(async (request) => {
    const { uid } = (0, auth_1.requireAdmin)(request);
    const data = request.data;
    const finalData = {
        ...data,
        authorId: uid,
    };
    return await (0, transparency_service_1.createTransparencyFolder)(finalData);
});
exports.updateTransparencyCallable = (0, https_1.onCall)(async (request) => {
    const { uid } = (0, auth_1.requireAdmin)(request);
    const { id, ...data } = request.data;
    const finalData = {
        ...data,
        authorId: uid,
    };
    return await (0, transparency_service_1.updateTransparency)(id, finalData);
});
exports.updateTransparencyFolderCallable = (0, https_1.onCall)(async (request) => {
    const { uid } = (0, auth_1.requireAdmin)(request);
    const { id, ...data } = request.data;
    const finalData = {
        ...data,
        authorId: uid,
    };
    return await (0, transparency_service_1.updateTransparencyFolder)(id, finalData);
});
exports.deleteTransparencyCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const id = request.data;
    return await (0, transparency_service_1.deleteTransparency)(id);
});
exports.bulkDeleteTransparencyCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const ids = request.data;
    return await (0, transparency_service_1.bulkDeleteTransparency)(ids);
});
exports.deleteTransparencyFolderCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const id = request.data;
    return await (0, transparency_service_1.deleteTransparencyFolder)(id);
});
exports.getPaginatedTransparencyCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const res = await (0, transparency_service_1.getPaginatedTransparency)(request.data);
    return res.data;
});
exports.getTotalTransparencyCountCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    return await (0, transparency_service_1.getTotalTransparencyCount)(request.data);
});
exports.getTransparencyFolderCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { year, title } = request.data;
    if (year && title) {
        return await (0, transparency_service_1.getTransparencyFolder)(year, title);
    }
    return await (0, transparency_service_1.getTransparencyFolder)(year, title);
});
exports.getTransparencyWithFiltersCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { year, status } = request.data;
    return await (0, transparency_service_1.getTransparencyWithFilters)(year, status);
});
