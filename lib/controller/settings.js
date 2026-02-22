"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchSettingsController = exports.getSettingsController = void 0;
const handler_1 = require("../middleware/handler");
const settings_service_1 = require("../services/settings.service");
exports.getSettingsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await (0, settings_service_1.getlogCleanupSettings)();
    console.log("req.query", req.query);
    res.status(200).json(response);
});
exports.patchSettingsController = (0, handler_1.asyncHandler)(async (req, res) => {
    console.log("req.body", req.body);
    await (0, settings_service_1.updateLogCleanupSettings)(req.body);
    res.status(200).json({ message: "Settings updated successfully" });
});
