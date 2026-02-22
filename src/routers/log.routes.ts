import { Router } from "express";

import {
  getPaginatedLogsController,
  getPaginatedLogsTotalCountController,
  testDeleteLogsController,
} from "../controller/log";

const router = Router();

router.get("/", getPaginatedLogsController);
router.get("/count", getPaginatedLogsTotalCountController);

router.delete("/", testDeleteLogsController);

export default router;
