// repositories/settings.repository.ts
import { Firestore, Timestamp } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

import { LogCleanupSettings } from "../model/setting.model.schema";

const SETTINGS_COLLECTION = "settings";
const LOG_CLEANUP_SETTINGS_DOC = "log_cleanup";

export class SettingsRepository extends FirestoreRepository<LogCleanupSettings> {
  constructor(db: Firestore) {
    super(db, SETTINGS_COLLECTION);
  }

  private defaultSettings = {
    id: LOG_CLEANUP_SETTINGS_DOC,
    enabled: true,
    scheduleExpression: "* * * * *",
    retentionDays: 0,
    batchSize: 500,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  async getLogCleanupSettings(): Promise<LogCleanupSettings> {
    const doc = await this.col().doc(LOG_CLEANUP_SETTINGS_DOC).get();

    if (!doc.exists) {
      // Return defaults if not set
      return this.defaultSettings as LogCleanupSettings;
    }

    const data = doc.data();

    const iso = {
      id: doc.id,
      ...data,
      lastRun: data?.lastRun?.toDate().toISOString(),
      nextRun: data?.nextRun?.toDate().toISOString(),
    };

    return iso as LogCleanupSettings;
  }

  async updateLogCleanupSettings(settings: Partial<LogCleanupSettings>) {
    const result = await this.update(LOG_CLEANUP_SETTINGS_DOC, settings);
    return result;
  }

  async updateLastRun(timestamp: FirebaseFirestore.Timestamp): Promise<void> {
    await this.db.collection(SETTINGS_COLLECTION).doc(LOG_CLEANUP_SETTINGS_DOC).update({
      lastRun: timestamp,
    });
  }
}
