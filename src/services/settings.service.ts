import { Timestamp } from "firebase-admin/firestore"; // <-- use this
import { db } from "../config/firebase";
import cronParser from "cron-parser";

import { serviceHandler } from "../middleware/handler";

import { SettingsRepository } from "../repositories/settings.repository";
import { ActivityLogRepository } from "../repositories/activity.log.repository";

import { LogCleanupSettings } from "../validation/log-cleanup-settings.schema";
import { CacheService, cacheService } from "../utils/cache";

const settingsRepo = new SettingsRepository(db);
const logRepo = new ActivityLogRepository(db);

export class SettingsService {
  constructor(
    private readonly settingsRepo: SettingsRepository,
    private readonly logRepo: ActivityLogRepository,
    private readonly cache: CacheService,
    private readonly prefix = "transparency",
  ) {}

  async invalidateLogCleanupSettingsCache() {
    await this.cache.invalidatePattern(`${this.prefix}:log-cleanup-settings`);
  }

  key(type: string, params?: Record<string, unknown>) {
    return this.cache.keyBuilder(this.prefix, type, params);
  }

  async getlogCleanupSettings() {
    const key = this.key("log-cleanup-settings");
    return this.cache.cacheAside(key, () => settingsRepo.getLogCleanupSettings());
  }

  async updateLogCleanupSettings(settings: Partial<LogCleanupSettings>) {
    // compute nextRun based on scheduleExpression if scheduleExpression is provided
    if (settings.scheduleExpression) {
      const interval = cronParser.parse(settings.scheduleExpression, {
        currentDate: new Date(),
        tz: "Asia/Manila",
      });

      const nextRunDate = interval.next().toDate();
      settings.nextRun = Timestamp.fromDate(nextRunDate); // <-- fixed
    }

    await serviceHandler("UPDATE_LOG_CLEANUP_SETTINGS", () => settingsRepo.updateLogCleanupSettings(settings));

    await this.invalidateLogCleanupSettingsCache();

    return;
  }
}

export const settingsService = new SettingsService(settingsRepo, logRepo, cacheService);
