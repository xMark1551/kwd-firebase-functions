import type { Firestore } from "firebase-admin/firestore";
import { FirestoreRepository } from "./base.repository";
import { ACTIVITY_LOG_COLLECTION } from "../const/collection.name";

import { logService } from "../services/logger.service";

export class ActivityLogRepository extends FirestoreRepository<any> {
  // Default retention period in days
  private readonly DEFAULT_RETENTION_DAYS = 90;

  constructor(db: Firestore) {
    super(db, ACTIVITY_LOG_COLLECTION);
  }

  /**
   * Delete logs older than specified days
   * @param retentionDays Number of days to keep logs (default: 90)
   * @param batchSize Number of logs to delete per batch (default: 500)
   * @returns Number of logs deleted
   */

  async getOldLogs(cutoffDate: Date, limit: number): Promise<FirebaseFirestore.QuerySnapshot> {
    return this.col().where("createdAt", "<", cutoffDate).limit(limit).get();
  }

  async deleteDocs(docs: FirebaseFirestore.QueryDocumentSnapshot[]): Promise<void> {
    const batch = this.db.batch();

    docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  /**
   * Get count of logs older than specified days
   * Useful for checking before cleanup
   */
  async getOldLogsCount(retentionDays: number = this.DEFAULT_RETENTION_DAYS): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const snapshot = await this.db.collection(this.collectionName).where("timestamp", "<", cutoffDate).count().get();

      return snapshot.data().count;
    } catch (error: any) {
      logService.error("Failed to get old logs count", { error: error.message });
      return 0;
    }
  }

  /**
   * Get storage statistics for logs
   */
  async getLogStats(): Promise<{
    total: number;
    byLevel: { info: number; warning: number; error: number };
    oldLogsCount: number;
  }> {
    try {
      const [totalSnap, infoSnap, warningSnap, errorSnap] = await Promise.all([
        this.db.collection(this.collectionName).count().get(),
        this.db.collection(this.collectionName).where("level", "==", "info").count().get(),
        this.db.collection(this.collectionName).where("level", "==", "warning").count().get(),
        this.db.collection(this.collectionName).where("level", "==", "error").count().get(),
      ]);

      const oldLogsCount = await this.getOldLogsCount();

      return {
        total: totalSnap.data().count,
        byLevel: {
          info: infoSnap.data().count,
          warning: warningSnap.data().count,
          error: errorSnap.data().count,
        },
        oldLogsCount,
      };
    } catch (error: any) {
      logService.error("Failed to get log stats", { error: error.message });
      return {
        total: 0,
        byLevel: { info: 0, warning: 0, error: 0 },
        oldLogsCount: 0,
      };
    }
  }
}
