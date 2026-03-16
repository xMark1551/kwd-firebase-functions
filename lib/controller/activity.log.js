"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllLogsController = exports.getPaginatedLogsTotalCountController = exports.getPaginatedLogsController = void 0;
const handler_1 = require("../middleware/handler");
const reponse_1 = require("../utils/reponse");
const activity_log_service_1 = require("../services/activity.log.service");
exports.getPaginatedLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const logs = await activity_log_service_1.activityLogService.getPaginatedLogsWithTotalCount(query);
    (0, reponse_1.ok)(res, logs, "Logs fetched");
});
exports.getPaginatedLogsTotalCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await activity_log_service_1.activityLogService.getPaginatedLogsTotalCount(query);
    (0, reponse_1.ok)(res, { count: response }, "Logs total count fetched");
});
exports.clearAllLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await activity_log_service_1.activityLogService.clearAllLogs();
    (0, reponse_1.ok)(res, response, "Logs cleared");
});
