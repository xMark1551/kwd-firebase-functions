import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";

import { settingsService } from "../services/settings.service";

export const getSettingsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await settingsService.getlogCleanupSettings();

  res.status(200).json(response);
});

export const patchSettingsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await settingsService.updateLogCleanupSettings(req.body);

  res.status(200).json(response);
});
