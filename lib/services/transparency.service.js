"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransparencyWithFilters = exports.getTransparencyFolder = exports.getTotalTransparencyCount = exports.getPaginatedTransparency = exports.deleteTransparencyFolder = exports.bulkDeleteTransparency = exports.deleteTransparency = exports.updateTransparencyFolder = exports.patchTransparency = exports.createTransparencyFolder = exports.createTransparency = void 0;
// src/services/news/news.service.ts
const firebase_1 = require("../config/firebase");
const transaprency_repository_1 = require("../repositories/transaprency.repository");
const upload_file_1 = require("../storage/upload.file");
const deleteFile_1 = require("../storage/deleteFile");
const transparencyRepo = new transaprency_repository_1.TransparencyRepository(firebase_1.db);
const createTransparency = async (user, data, fileToUpload) => {
    let uploadedFile = { name: "", url: "" };
    try {
        if (fileToUpload) {
            const { fileName, url: uploadUrls } = await (0, upload_file_1.uploadFile)("transparency", fileToUpload);
            uploadedFile = { name: fileName, url: uploadUrls };
        }
        return await transparencyRepo.createTransparency({
            ...data,
            authorId: user.uid,
            file: { name: uploadedFile.name, url: uploadedFile.url },
        });
    }
    catch (error) {
        if (uploadedFile) {
            await (0, deleteFile_1.deleteFile)(uploadedFile.url);
        }
        throw error;
    }
};
exports.createTransparency = createTransparency;
const createTransparencyFolder = async (user, data) => {
    return await transparencyRepo.createTransparencyFolder(data);
};
exports.createTransparencyFolder = createTransparencyFolder;
const patchTransparency = async (id, data, fileToUpload) => {
    let uploadedFile = null;
    try {
        if (fileToUpload) {
            const { fileName, url: uploadUrls } = await (0, upload_file_1.uploadFile)("transparency", fileToUpload);
            uploadedFile = { name: fileName, url: uploadUrls };
            data.file = {
                name: uploadedFile.name,
                url: uploadedFile.url,
            };
        }
        return await transparencyRepo.updateTransparency(id, data);
    }
    catch (error) {
        if (uploadedFile) {
            await (0, deleteFile_1.deleteFile)(uploadedFile.url);
        }
        throw error;
    }
};
exports.patchTransparency = patchTransparency;
const updateTransparencyFolder = async (id, payload) => {
    return await transparencyRepo.updateTransparencyFolder(id, payload);
};
exports.updateTransparencyFolder = updateTransparencyFolder;
const deleteTransparency = async (id) => {
    return await transparencyRepo.deleteTransparency(id);
};
exports.deleteTransparency = deleteTransparency;
const bulkDeleteTransparency = async (ids) => {
    return await transparencyRepo.bulkDeleteTransparency(ids);
};
exports.bulkDeleteTransparency = bulkDeleteTransparency;
const deleteTransparencyFolder = async (id) => {
    return await transparencyRepo.deleteTransparencyFolder(id);
};
exports.deleteTransparencyFolder = deleteTransparencyFolder;
const getPaginatedTransparency = async ({ page, pageSize, year, status, title }) => {
    const filters = [];
    if (year)
        filters.push({ field: "year", op: "==", value: year });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    if (title)
        filters.push({ field: "title", op: "==", value: title });
    return await transparencyRepo.getPaginated({ page, pageSize, filters });
};
exports.getPaginatedTransparency = getPaginatedTransparency;
const getTotalTransparencyCount = async ({ year, title, status }) => {
    const filters = [];
    if (year)
        filters.push({ field: "year", op: "==", value: year });
    if (title)
        filters.push({ field: "title", op: "==", value: title });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    return await transparencyRepo.totalCount(filters);
};
exports.getTotalTransparencyCount = getTotalTransparencyCount;
const getTransparencyFolder = async ({ year, title }) => {
    const filters = [];
    if (year)
        filters.push({ field: "year", op: "==", value: year });
    if (title)
        filters.push({ field: "title", op: "==", value: title });
    return await transparencyRepo.listTransparencyFolders(filters);
};
exports.getTransparencyFolder = getTransparencyFolder;
const getTransparencyWithFilters = async ({ year, status }) => {
    const filters = [];
    if (year)
        filters.push({ field: "year", op: "==", value: year });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    return await transparencyRepo.listAllWithFilters(filters);
};
exports.getTransparencyWithFilters = getTransparencyWithFilters;
