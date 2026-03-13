import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { ok } from "../utils/reponse";

import { activityLogService } from "../services/activity.log.service";

export const getPaginatedLogsController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;
  const logs = await activityLogService.getPaginatedLogsWithTotalCount(query);

  ok(res, logs, "Logs fetched");
});

export const getPaginatedLogsTotalCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;
  const response = await activityLogService.getPaginatedLogsTotalCount(query);

  ok(res, { count: response }, "Logs total count fetched");
});

export const clearAllLogsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await activityLogService.clearAllLogs();

  ok(res, response, "Logs cleared");
});
