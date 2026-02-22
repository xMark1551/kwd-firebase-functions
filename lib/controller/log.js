"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDeleteLogsController = exports.getPaginatedLogsTotalCountController = exports.getPaginatedLogsController = void 0;
const handler_1 = require("../middleware/handler");
const logger_service_1 = require("../services/logger.service");
exports.getPaginatedLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    console.log("req.query", req.query);
    const logs = await (0, logger_service_1.getPaginatedLogs)(req.query);
    res.status(200).json(logs);
});
exports.getPaginatedLogsTotalCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await (0, logger_service_1.getPaginatedLogsTotalCount)();
    res.status(200).json({
        count: response,
    });
});
exports.testDeleteLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await (0, logger_service_1.testDeleteLogs)();
    res.status(200).json(response);
});
