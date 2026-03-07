"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDeleteLogsController = exports.getPaginatedLogsTotalCountController = exports.getPaginatedLogsController = void 0;
const handler_1 = require("../middleware/handler");
const logger_service_1 = require("../services/logger.service");
exports.getPaginatedLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    console.log("req.query", req.query);
    const logs = await logger_service_1.logService.getPaginatedLogs(req.query);
    res.status(200).json(logs);
});
exports.getPaginatedLogsTotalCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await logger_service_1.logService.getPaginatedLogsTotalCount();
    res.status(200).json({
        count: response,
    });
});
exports.testDeleteLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await logger_service_1.logService.testDeleteLogs();
    res.status(200).json(response);
});
