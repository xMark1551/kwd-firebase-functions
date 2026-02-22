"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLogCleanupSettings = exports.getlogCleanupSettings = void 0;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore"); // <-- use this
const cron_parser_1 = __importDefault(require("cron-parser"));
const settings_repository_1 = require("../repositories/settings.repository");
const settingsRepo = new settings_repository_1.SettingsRepository(firebase_1.db);
const getlogCleanupSettings = () => {
    return settingsRepo.getLogCleanupSettings();
};
exports.getlogCleanupSettings = getlogCleanupSettings;
const updateLogCleanupSettings = (settings) => {
    // compute nextRun based on scheduleExpression if scheduleExpression is provided
    if (settings.scheduleExpression) {
        const interval = cron_parser_1.default.parse(settings.scheduleExpression, {
            currentDate: new Date(),
            tz: "Asia/Manila",
        });
        const nextRunDate = interval.next().toDate();
        settings.nextRun = firestore_1.Timestamp.fromDate(nextRunDate); // <-- fixed
    }
    return settingsRepo.updateLogCleanupSettings(settings);
};
exports.updateLogCleanupSettings = updateLogCleanupSettings;
