"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllLogsController = exports.getPaginatedLogsTotalCountController = exports.getPaginatedLogsController = void 0;
const handler_1 = require("../middleware/handler");
const activity_log_service_1 = require("../services/activity.log.service");
exports.getPaginatedLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const logs = await activity_log_service_1.activityLogService.getPaginatedLogsWithTotalCount(query);
    res.status(200).json({
        ok: true,
        items: logs.items,
        meta: logs.meta,
        nextCursor: logs.nextCursor,
    });
});
exports.getPaginatedLogsTotalCountController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await activity_log_service_1.activityLogService.getPaginatedLogsTotalCount(query);
    res.status(200).json({
        count: response,
    });
});
exports.clearAllLogsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await activity_log_service_1.activityLogService.clearAllLogs();
    res.status(200).json(response);
});
