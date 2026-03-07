"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldLogs = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const cron_parser_1 = __importDefault(require("cron-parser"));
const activity_log_service_1 = require("../services/activity.log.service");
const settings_service_1 = require("../services/settings.service");
exports.cleanupOldLogs = (0, scheduler_1.onSchedule)({
    schedule: "* * 1 * *", // Check every hour
    timeZone: "Asia/Manila",
    memory: "256MiB",
    timeoutSeconds: 540,
}, async () => {
    console.log("✅ SCHEDULE TRIGGER FIRED", new Date().toISOString());
    // 1) Load settings (defaults if missing)
    const settings = await settings_service_1.settingsService.getlogCleanupSettings();
    console.log("settings:", settings);
    if (!settings.enabled) {
        console.log("🚫 log cleanup disabled");
        return;
    }
    const now = new Date();
    // 2) If nextRun is set and still in the future, do nothing
    if (settings.nextRun && settings.nextRun.toDate() > now) {
        console.log("🕒 not time yet. nextRun:", settings.nextRun.toDate().toISOString());
        return;
    }
    // 3) Run cleanup using retention settings
    console.log("✅ running log cleanup now...");
    const deleted = await activity_log_service_1.activityLogService.cleanupOldLogs(settings.retentionDays, settings.batchSize);
    console.log("✅ CLEANUP DONE. Deleted:", deleted);
    // 4) Compute the next run time from cron expression
    const interval = cron_parser_1.default.parse(settings.scheduleExpression, {
        currentDate: now,
        tz: "Asia/Manila",
    });
    const nextRunDate = interval.next().toDate();
    // 5) Save lastRun + nextRun
    await settings_service_1.settingsService.updateLogCleanupSettings({
        lastRun: admin.firestore.Timestamp.fromDate(now),
        nextRun: admin.firestore.Timestamp.fromDate(nextRunDate),
    });
    console.log("🎉 cleanup done", {
        deleted: deleted,
        nextRun: nextRunDate.toISOString(),
    });
    console.log("✅ DONE");
    return;
});
