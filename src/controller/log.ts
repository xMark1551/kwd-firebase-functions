import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/handler";

import { getPaginatedLogs, getPaginatedLogsTotalCount, testDeleteLogs } from "../services/logger.service";

export const getPaginatedLogsController = asyncHandler(async (req: Request, res: Response) => {
  console.log("req.query", req.query);
  const logs = await getPaginatedLogs(req.query as any);

  res.status(200).json(logs);
});

export const getPaginatedLogsTotalCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await getPaginatedLogsTotalCount();

  res.status(200).json({
    count: response,
  });
});

export const testDeleteLogsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await testDeleteLogs();

  res.status(200).json(response);
});
