"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore"); // <-- use this
const cron_parser_1 = __importDefault(require("cron-parser"));
const settings_repository_1 = require("../repositories/settings.repository");
const activity_log_repository_1 = require("../repositories/activity.log.repository");
const cache_1 = require("../utils/cache");
const settingsRepo = new settings_repository_1.SettingsRepository(firebase_1.db);
const logRepo = new activity_log_repository_1.ActivityLogRepository(firebase_1.db);
class SettingsService {
    constructor(settingsRepo, logRepo, cache, prefix = "transparency") {
        this.settingsRepo = settingsRepo;
        this.logRepo = logRepo;
        this.cache = cache;
        this.prefix = prefix;
    }
    async invalidateLogCleanupSettingsCache() {
        await this.cache.invalidatePattern(`${this.prefix}:log-cleanup-settings`);
    }
    key(type, params) {
        return this.cache.keyBuilder(this.prefix, type, params);
    }
    async getlogCleanupSettings() {
        const key = this.key("log-cleanup-settings");
        return this.cache.cacheAside(key, () => settingsRepo.getLogCleanupSettings());
    }
    async updateLogCleanupSettings(settings) {
        // compute nextRun based on scheduleExpression if scheduleExpression is provided
        if (settings.scheduleExpression) {
            const interval = cron_parser_1.default.parse(settings.scheduleExpression, {
                currentDate: new Date(),
                tz: "Asia/Manila",
            });
            const nextRunDate = interval.next().toDate();
            settings.nextRun = firestore_1.Timestamp.fromDate(nextRunDate); // <-- fixed
        }
        const result = await settingsRepo.updateLogCleanupSettings(settings);
        await this.invalidateLogCleanupSettingsCache();
        return result;
    }
}
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService(settingsRepo, logRepo, cache_1.cacheService);
