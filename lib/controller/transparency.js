"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransparencyCountThisYearController = exports.deleteTransparencyFolderController = exports.bulkDeleteTransparencyController = exports.deleteTransparencyController = exports.patchTransparencyFolderController = exports.patchTransparencyController = exports.getTransparencyWithFiltersController = exports.getTransparencyFolderController = exports.getTotalTransparencyCountController = exports.getPaginatedTransparencyController = exports.createTransparencyFolderController = exports.createTransparencyController = void 0;
const handler_1 = require("../middleware/handler");
const reponse_1 = require("../utils/reponse");
const transparency_service_1 = require("../services/transparency.service");
exports.createTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const fileToUpload = req.filesToUpload[0];
    const response = await transparency_service_1.transparencyService.createTransparency(user, data, fileToUpload);
    (0, reponse_1.ok)(res, response, "Transparency created");
});
exports.createTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const response = await transparency_service_1.transparencyService.createTransparencyFolder(user, data);
    (0, reponse_1.ok)(res, response, "Transparency folder created");
});
exports.getPaginatedTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await transparency_service_1.transparencyService.getPaginatedTransparencyWithCount(query);
    (0, reponse_1.ok)(res, response, "Transparency fetched");
});
exports.getTotalTransparencyCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await transparency_service_1.transparencyService.getTotalTransparencyCount(query);
    (0, reponse_1.ok)(res, { count: response }, "Transparency total count fetched");
});
exports.getTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await transparency_service_1.transparencyService.getTransparencyFolder(query);
    (0, reponse_1.ok)(res, response, "Transparency folder fetched");
});
exports.getTransparencyWithFiltersController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await transparency_service_1.transparencyService.getTransparencyWithFilters(query);
    (0, reponse_1.ok)(res, response, "Transparency fetched");
});
exports.patchTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const fileToUpload = req.filesToUpload[0];
    const response = await transparency_service_1.transparencyService.patchTransparency(id, data, fileToUpload);
    (0, reponse_1.ok)(res, response, "Transparency updated");
});
exports.patchTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const response = await transparency_service_1.transparencyService.updateTransparencyFolder(id, data);
    (0, reponse_1.ok)(res, response, "Transparency folder updated");
});
exports.deleteTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await transparency_service_1.transparencyService.deleteTransparency(id);
    (0, reponse_1.ok)(res, response, "Transparency deleted");
});
exports.bulkDeleteTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    const response = await transparency_service_1.transparencyService.bulkDeleteTransparency(ids);
    (0, reponse_1.ok)(res, response, "Transparency bulk deleted");
});
exports.deleteTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const response = await transparency_service_1.transparencyService.deleteTransparencyFolder(id);
    (0, reponse_1.ok)(res, response, "Transparency folder deleted");
});
exports.getTransparencyCountThisYearController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await transparency_service_1.transparencyService.fetchTransparencyThisYear();
    (0, reponse_1.ok)(res, response, "Transparency count fetched");
});
