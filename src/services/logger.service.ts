import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../config/firebase";
import { LogRepository } from "../repositories/log.repository";

import { SettingsRepository } from "../repositories/settings.repository";

import * as admin from "firebase-admin";
import cronParser from "cron-parser";

const logRepo = new LogRepository(db);
const settingsRepo = new SettingsRepository(db);

export const loggers = async (log: Omit<ActivityLog, "id" | "createdAt" | "timestamp">) => {
  try {
    console.log("creating");
    await logRepo.createLog(log);
  } catch (error) {
    console.error("Failed to write log to database:", error);

    throw error;
  }
};

export const getPaginatedLogs = async (query: any) => {
  const { page, pageSize } = query;

  const filters: any[] = [];

  return await logRepo.getPaginated({ page, pageSize, filters });
};

export const getPaginatedLogsTotalCount = async () => {
  const filters: any[] = [];

  return await logRepo.totalCount(filters);
};

export const testDeleteLogs = async () => {
  await logRepo.cleanupOldLogs();
};

export const cleanupOldLogss = onSchedule(
  {
    schedule: "* * 1 * *", // Check every hour
    timeZone: "Asia/Manila",
    memory: "256MiB",
    timeoutSeconds: 540,
  },
  async () => {
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
    const interval = cronParser.parse(settings.scheduleExpression, {
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
  },
);
