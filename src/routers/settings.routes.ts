import { Router } from "express";

import { patchSettingsController, getSettingsController } from "../controller/settings";

import { requireAdmin } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validate";
import { patchLogSettingsSchema } from "../validation/settings.schema";
import { idSchema } from "../validation/id.schema";

const router = Router();

router.get("/", getSettingsController);
router.patch(
  "/:id",
  requireAdmin,
  validateParams(idSchema),
  validateBody(patchLogSettingsSchema),
  patchSettingsController,
);

export default router;
