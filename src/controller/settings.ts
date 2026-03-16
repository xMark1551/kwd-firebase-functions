import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { ok } from "../utils/reponse";

import { settingsService } from "../services/settings.service";

export const getSettingsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await settingsService.getlogCleanupSettings();

  ok(res, response, "Settings fetched");
});

export const patchSettingsController = asyncHandler(async (req: Request, res: Response) => {
  const response = await settingsService.updateLogCleanupSettings(req.body);

  ok(res, response, "Settings updated");
});
