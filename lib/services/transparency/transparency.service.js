"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransparencyWithFilters = exports.getTransparencyFolder = exports.getTotalTransparencyCount = exports.getPaginatedTransparency = exports.deleteTransparencyFolder = exports.bulkDeleteTransparency = exports.deleteTransparency = exports.updateTransparencyFolder = exports.updateTransparency = exports.createTransparencyFolder = exports.createTransparency = void 0;
// src/services/news/news.service.ts
const firebase_1 = require("../../config/firebase");
const transaprency_repository_1 = require("../../repositories/transaprency.repository");
const transparencyRepo = new transaprency_repository_1.TransparencyRepository(firebase_1.db);
const createTransparency = async (payload) => {
    return await transparencyRepo.create(payload);
};
exports.createTransparency = createTransparency;
const createTransparencyFolder = async (payload) => {
    return await transparencyRepo.createTransparencyFolder(payload);
};
exports.createTransparencyFolder = createTransparencyFolder;
const updateTransparency = async (id, payload) => {
    return await transparencyRepo.updateTransparency(id, payload);
};
exports.updateTransparency = updateTransparency;
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
const getPaginatedTransparency = async (payload) => {
    const { page, pageSize, year, status, title } = payload;
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
const getTotalTransparencyCount = async (payload) => {
    const { year, title, status } = payload;
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
const getTransparencyFolder = async (year, title) => {
    const filters = [];
    if (year)
        filters.push({ field: "year", op: "==", value: year });
    if (title)
        filters.push({ field: "title", op: "==", value: title });
    return await transparencyRepo.listTransparencyFolders(filters);
};
exports.getTransparencyFolder = getTransparencyFolder;
const getTransparencyWithFilters = async (year, status) => {
    const filters = [];
    if (year)
        filters.push({ field: "year", op: "==", value: year });
    if (status)
        filters.push({ field: "status", op: "==", value: status });
    return await transparencyRepo.listAllWithFilters(filters);
};
exports.getTransparencyWithFilters = getTransparencyWithFilters;
