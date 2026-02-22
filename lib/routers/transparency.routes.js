"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transparency_1 = require("../controller/transparency");
const middleware_1 = require("../middleware/middleware");
const multipart_busboy_1 = require("../middleware/multipart.busboy");
const validate_1 = require("../middleware/validate");
const transparency_schema_1 = require("../validation/transparency.schema");
const id_schema_1 = require("../validation/id.schema");
const router = (0, express_1.Router)();
// public routes
router.get("/", (0, validate_1.validateQuery)(transparency_schema_1.getPaginatedTransparencySchema), transparency_1.getPaginatedTransparencyController);
router.get("/count", (0, validate_1.validateQuery)(transparency_schema_1.getTotalTransparencyCountSchema), transparency_1.getTotalTransparencyCountController);
router.get("/folder", (0, validate_1.validateQuery)(transparency_schema_1.getTransparencyFolder), transparency_1.getTransparencyFolderController);
router.get("/withFilters", (0, validate_1.validateQuery)(transparency_schema_1.getTransparencyWithFilters), transparency_1.getTransparencyWithFiltersController);
// private routes
router.post("/", middleware_1.requireAdmin, (0, multipart_busboy_1.multipartBusboy)({
    maxFiles: 1,
    maxFileSizeBytes: 10 * 1024 * 1024, // limit to 10MB
    allowedTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ],
}), (0, validate_1.validateBody)(transparency_schema_1.createTransparencySchema), transparency_1.createTransparencyController);
router.post("/folder", middleware_1.requireAdmin, (0, validate_1.validateBody)(transparency_schema_1.createTransparencyFolderSchema), transparency_1.createTransparencyFolderController);
router.patch("/:id", middleware_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), (0, multipart_busboy_1.multipartBusboy)({
    maxFiles: 50,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ],
}), (0, validate_1.validateBody)(transparency_schema_1.patchTransparencySchema), transparency_1.patchTransparencyController);
router.patch("/folder/:id", middleware_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), (0, validate_1.validateBody)(transparency_schema_1.patchTransparencyFolderSchema), transparency_1.patchTransparencyFolderController);
router.delete("/bulkDelete", middleware_1.requireAdmin, (0, validate_1.validateBody)(id_schema_1.idsSchema), transparency_1.bulkDeleteTransparencyController);
router.delete("/folder/:id", middleware_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), transparency_1.deleteTransparencyFolderController);
router.delete("/:id", middleware_1.requireAdmin, (0, validate_1.validateParams)(id_schema_1.idSchema), transparency_1.deleteTransparencyController);
exports.default = router;
