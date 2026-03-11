"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controller/auth");
const validate_1 = require("../middleware/validate");
const auth_schema_1 = require("../validation/auth.schema");
const router = (0, express_1.Router)();
router.post("/login", (0, validate_1.validateBody)(auth_schema_1.loginSchema), auth_1.loginController);
exports.default = router;
