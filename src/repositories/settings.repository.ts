// repositories/settings.repository.ts
import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";

const SETTINGS_COLLECTION = "settings";
const LOG_CLEANUP_SETTINGS_DOC = "log_cleanup";

// types/settings.types.ts
export interface LogCleanupSettings {
  id: string;
  enabled: boolean;
  scheduleExpression: string; // Cron expression
  retentionDays: number;
  lastRun?: FirebaseFirestore.Timestamp;
  nextRun?: FirebaseFirestore.Timestamp;
  batchSize?: number;
}

export class SettingsRepository extends FirestoreRepository<any> {
  constructor(db: Firestore) {
    super(db, SETTINGS_COLLECTION);
  }

  async getLogCleanupSettings(): Promise<LogCleanupSettings> {
    const doc = await this.db.collection(SETTINGS_COLLECTION).doc(LOG_CLEANUP_SETTINGS_DOC).get();

    if (!doc.exists) {
      // Return defaults if not set
      return {
        id: LOG_CLEANUP_SETTINGS_DOC,
        enabled: true,
        scheduleExpression: "* * * * *",
        retentionDays: 0,
        batchSize: 500,
      };
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

  async updateLogCleanupSettings(settings: Partial<LogCleanupSettings>): Promise<void> {
    console.log("Updating log cleanup settings with:", settings);
    await this.db.collection(SETTINGS_COLLECTION).doc(LOG_CLEANUP_SETTINGS_DOC).set(settings, { merge: true });
  }

  async updateLastRun(timestamp: FirebaseFirestore.Timestamp): Promise<void> {
    await this.db.collection(SETTINGS_COLLECTION).doc(LOG_CLEANUP_SETTINGS_DOC).update({
      lastRun: timestamp,
    });
  }
}
