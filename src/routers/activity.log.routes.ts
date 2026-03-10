import { Router } from "express";

import { requireAdmin } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { getPaginatedActivityLogsSchema } from "../validation/activity-log.schema";

import {
  getPaginatedLogsController,
  getPaginatedLogsTotalCountController,
  clearAllLogsController,
} from "../controller/activity.log";

const router = Router();

router.get("/", requireAdmin, validateQuery(getPaginatedActivityLogsSchema), getPaginatedLogsController);
router.get("/count", requireAdmin, getPaginatedLogsTotalCountController);

router.delete("/", clearAllLogsController);

export default router;
