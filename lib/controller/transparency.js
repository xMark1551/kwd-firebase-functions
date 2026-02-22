"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransparencyFolderController = exports.bulkDeleteTransparencyController = exports.deleteTransparencyController = exports.patchTransparencyFolderController = exports.patchTransparencyController = exports.getTransparencyWithFiltersController = exports.getTransparencyFolderController = exports.getTotalTransparencyCountController = exports.getPaginatedTransparencyController = exports.createTransparencyFolderController = exports.createTransparencyController = void 0;
const handler_1 = require("../middleware/handler");
const transparency_service_1 = require("../services/transparency.service");
exports.createTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const fileToUpload = req.filesToUpload[0];
    await (0, transparency_service_1.createTransparency)(user, data, fileToUpload);
    res.status(200).json({
        ok: true,
    });
});
exports.createTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const response = await (0, transparency_service_1.createTransparencyFolder)(user, data);
    res.status(200).json({
        ok: true,
        data: { id: response },
    });
});
exports.getPaginatedTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await (0, transparency_service_1.getPaginatedTransparency)(query);
    res.status(200).json({
        ok: true,
        items: response.items,
        meta: response.meta,
    });
});
exports.getTotalTransparencyCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await (0, transparency_service_1.getTotalTransparencyCount)(query);
    res.status(200).json({ count: response });
});
exports.getTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await (0, transparency_service_1.getTransparencyFolder)(query);
    res.status(200).json(response);
});
exports.getTransparencyWithFiltersController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    console.log("query", query);
    const response = await (0, transparency_service_1.getTransparencyWithFilters)(query);
    console.log("response", response);
    res.status(200).json(response);
});
exports.patchTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const fileToUpload = req.filesToUpload[0];
    await (0, transparency_service_1.patchTransparency)(id, data, fileToUpload);
    res.status(200).json({
        ok: true,
    });
});
exports.patchTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    await (0, transparency_service_1.updateTransparencyFolder)(id, data);
    res.status(200).json({
        ok: true,
    });
});
exports.deleteTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await (0, transparency_service_1.deleteTransparency)(id);
    res.status(200).json({
        ok: true,
    });
});
exports.bulkDeleteTransparencyController = (0, handler_1.asyncHandler)(async (req, res) => {
    const ids = req.body;
    await (0, transparency_service_1.bulkDeleteTransparency)(ids);
    res.status(200).json({
        ok: true,
    });
});
exports.deleteTransparencyFolderController = (0, handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await (0, transparency_service_1.deleteTransparencyFolder)(id);
    res.status(200).json({
        ok: true,
    });
});
