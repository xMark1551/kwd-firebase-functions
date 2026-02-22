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
exports.cleanupOldLogss = exports.testDeleteLogs = exports.getPaginatedLogsTotalCount = exports.getPaginatedLogs = exports.loggers = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_1 = require("../config/firebase");
const log_repository_1 = require("../repositories/log.repository");
const settings_repository_1 = require("../repositories/settings.repository");
const admin = __importStar(require("firebase-admin"));
const cron_parser_1 = __importDefault(require("cron-parser"));
const logRepo = new log_repository_1.LogRepository(firebase_1.db);
const settingsRepo = new settings_repository_1.SettingsRepository(firebase_1.db);
const loggers = async (log) => {
    try {
        console.log("creating");
        await logRepo.createLog(log);
    }
    catch (error) {
        console.error("Failed to write log to database:", error);
        throw error;
    }
};
exports.loggers = loggers;
const getPaginatedLogs = async (query) => {
    const { page, pageSize } = query;
    const filters = [];
    return await logRepo.getPaginated({ page, pageSize, filters });
};
exports.getPaginatedLogs = getPaginatedLogs;
const getPaginatedLogsTotalCount = async () => {
    const filters = [];
    return await logRepo.totalCount(filters);
};
exports.getPaginatedLogsTotalCount = getPaginatedLogsTotalCount;
const testDeleteLogs = async () => {
    await logRepo.cleanupOldLogs();
};
exports.testDeleteLogs = testDeleteLogs;
exports.cleanupOldLogss = (0, scheduler_1.onSchedule)({
    schedule: "* * 1 * *", // Check every hour
    timeZone: "Asia/Manila",
    memory: "256MiB",
    timeoutSeconds: 540,
}, async () => {
    console.log("✅ SCHEDULE TRIGGER FIRED", new Date().toISOString());
    // 1) Load settings (defaults if missing)
    const settings = await settingsRepo.getLogCleanupSettings();
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
    const deleted = await logRepo.cleanupOldLogs(settings.retentionDays, settings.batchSize);
    console.log("✅ CLEANUP DONE. Deleted:", deleted);
    // 4) Compute the next run time from cron expression
    const interval = cron_parser_1.default.parse(settings.scheduleExpression, {
        currentDate: now,
        tz: "Asia/Manila",
    });
    const nextRunDate = interval.next().toDate();
    // 5) Save lastRun + nextRun
    await settingsRepo.updateLogCleanupSettings({
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
