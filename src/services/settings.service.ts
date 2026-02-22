import { db } from "../config/firebase";

import { Timestamp } from "firebase-admin/firestore"; // <-- use this

import cronParser from "cron-parser";

import { SettingsRepository } from "../repositories/settings.repository";
import type { LogCleanupSettings } from "../repositories/settings.repository";

const settingsRepo = new SettingsRepository(db);

export const getlogCleanupSettings = () => {
  return settingsRepo.getLogCleanupSettings();
};

export const updateLogCleanupSettings = (settings: Partial<LogCleanupSettings>) => {
  // compute nextRun based on scheduleExpression if scheduleExpression is provided
  if (settings.scheduleExpression) {
    const interval = cronParser.parse(settings.scheduleExpression, {
      currentDate: new Date(),
      tz: "Asia/Manila",
    });

    const nextRunDate = interval.next().toDate();
    settings.nextRun = Timestamp.fromDate(nextRunDate); // <-- fixed
  }

  return settingsRepo.updateLogCleanupSettings(settings);
};
