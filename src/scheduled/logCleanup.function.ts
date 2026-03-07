import { onSchedule } from "firebase-functions/v2/scheduler";

import * as admin from "firebase-admin";
import cronParser from "cron-parser";

import { activityLogService } from "../services/activity.log.service";

import { settingsService } from "../services/settings.service";

export const cleanupOldLogs = onSchedule(
  {
    schedule: "* * 1 * *", // Check every hour
    timeZone: "Asia/Manila",
    memory: "256MiB",
    timeoutSeconds: 540,
  },
  async () => {
    console.log("✅ SCHEDULE TRIGGER FIRED", new Date().toISOString());

    // 1) Load settings (defaults if missing)
    const settings = await settingsService.getlogCleanupSettings();

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

    const deleted = await activityLogService.cleanupOldLogs(settings.retentionDays, settings.batchSize);
    console.log("✅ CLEANUP DONE. Deleted:", deleted);

    // 4) Compute the next run time from cron expression
    const interval = cronParser.parse(settings.scheduleExpression, {
      currentDate: now,
      tz: "Asia/Manila",
    });

    const nextRunDate = interval.next().toDate();

    // 5) Save lastRun + nextRun
    await settingsService.updateLogCleanupSettings({
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
