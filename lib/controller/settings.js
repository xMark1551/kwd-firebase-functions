"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchSettingsController = exports.getSettingsController = void 0;
const handler_1 = require("../middleware/handler");
const reponse_1 = require("../utils/reponse");
const settings_service_1 = require("../services/settings.service");
exports.getSettingsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await settings_service_1.settingsService.getlogCleanupSettings();
    (0, reponse_1.ok)(res, response, "Settings fetched");
});
exports.patchSettingsController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await settings_service_1.settingsService.updateLogCleanupSettings(req.body);
    (0, reponse_1.ok)(res, response, "Settings updated");
});
