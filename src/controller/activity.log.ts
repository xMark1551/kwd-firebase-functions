import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/handler";

import { activityLogService } from "../services/activity.log.service";

export const getPaginatedLogsController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;
  const logs = await activityLogService.getPaginatedLogsWithTotalCount(query);

  res.status(200).json({
    ok: true,
    items: logs.items,
    meta: logs.meta,
    nextCursor: logs.nextCursor,
  });
});

export const getPaginatedLogsTotalCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;
  const response = await activityLogService.getPaginatedLogsTotalCount(query);

  res.status(200).json({
    count: response,
  });
});

export const clearAllLogsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await activityLogService.clearAllLogs();

  res.status(200).json(response);
});
