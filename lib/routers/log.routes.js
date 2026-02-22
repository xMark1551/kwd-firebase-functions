"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const log_1 = require("../controller/log");
const router = (0, express_1.Router)();
router.get("/", log_1.getPaginatedLogsController);
router.get("/count", log_1.getPaginatedLogsTotalCountController);
router.delete("/", log_1.testDeleteLogsController);
exports.default = router;
