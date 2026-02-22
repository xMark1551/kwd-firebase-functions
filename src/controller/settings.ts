import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/handler";

import { getlogCleanupSettings, updateLogCleanupSettings } from "../services/settings.service";

export const getSettingsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await getlogCleanupSettings();
  console.log("req.query", req.query);

  res.status(200).json(response);
});

export const patchSettingsController = asyncHandler(async (req: Request, res: Response) => {
  console.log("req.body", req.body);

  await updateLogCleanupSettings(req.body);

  res.status(200).json({ message: "Settings updated successfully" });
});
