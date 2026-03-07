"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_1 = require("../controller/search");
const validate_1 = require("../middleware/validate");
const search_schema_1 = require("../validation/search.schema");
const router = (0, express_1.Router)();
router.get("/", (0, validate_1.validateQuery)(search_schema_1.searchSchema), search_1.searchController);
exports.default = router;
