"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogRepository = void 0;
const base_repository_1 = require("./base.repository");
const collection_name_1 = require("../const/collection.name");
class LogRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.ACTIVITY_LOG_COLLECTION);
        // Default retention period in days
        this.DEFAULT_RETENTION_DAYS = 90;
    }
    async createLog(log) {
        await this.create(log);
    }
    /**
     * Delete logs older than specified days
     * @param retentionDays Number of days to keep logs (default: 90)
     * @param batchSize Number of logs to delete per batch (default: 500)
     * @returns Number of logs deleted
     */
    async cleanupOldLogs(retentionDays = this.DEFAULT_RETENTION_DAYS, batchSize = 500) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            this.info(`Cleaning up logs older than ${retentionDays} days`, {
                cutoffDate: cutoffDate.toISOString(),
            });
            let totalDeleted = 0;
            let hasMore = true;
            while (hasMore) {
                const snapshot = await this.db
                    .collection(this.collectionName)
                    // .where("timestamp", "<", cutoffDate)
                    .limit(batchSize)
                    .get();
                if (snapshot.empty) {
                    hasMore = false;
                    break;
                }
                const batch = this.db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                totalDeleted += snapshot.size;
                this.info(`Deleted ${snapshot.size} logs in this batch`, {
                    totalDeleted,
                });
                // If we got fewer docs than batchSize, we're done
                hasMore = snapshot.size === batchSize;
            }
            this.info(`Cleanup completed`, { totalDeleted });
            return totalDeleted;
        }
        catch (error) {
            this.error("Failed to cleanup old logs", {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Delete logs by level older than specified days
     * Useful for keeping errors longer than info logs
     */
    async cleanupLogsByLevel(level, retentionDays, batchSize = 500) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            this.info(`Cleaning up ${level} logs older than ${retentionDays} days`);
            let totalDeleted = 0;
            let hasMore = true;
            while (hasMore) {
                const snapshot = await this.db
                    .collection(this.collectionName)
                    .where("level", "==", level)
                    .where("timestamp", "<", cutoffDate)
                    .limit(batchSize)
                    .get();
                if (snapshot.empty) {
                    hasMore = false;
                    break;
                }
                const batch = this.db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                totalDeleted += snapshot.size;
                hasMore = snapshot.size === batchSize;
            }
            this.info(`Cleanup completed for ${level} logs`, { totalDeleted });
            return totalDeleted;
        }
        catch (error) {
            this.error(`Failed to cleanup ${level} logs`, {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Get count of logs older than specified days
     * Useful for checking before cleanup
     */
    async getOldLogsCount(retentionDays = this.DEFAULT_RETENTION_DAYS) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const snapshot = await this.db.collection(this.collectionName).where("timestamp", "<", cutoffDate).count().get();
            return snapshot.data().count;
        }
        catch (error) {
            this.error("Failed to get old logs count", { error: error.message });
            return 0;
        }
    }
    /**
     * Get storage statistics for logs
     */
    async getLogStats() {
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
        }
        catch (error) {
            this.error("Failed to get log stats", { error: error.message });
            return {
                total: 0,
                byLevel: { info: 0, warning: 0, error: 0 },
                oldLogsCount: 0,
            };
        }
    }
    // For technical debugging - console only (or cloud logger)
    info(message, meta) {
        console.log(`[INFO] ${message}`, meta || "");
    }
    error(message, meta) {
        console.error(`[ERROR] ${message}`, meta || "");
    }
    warn(message, meta) {
        console.warn(`[WARN] ${message}`, meta || "");
    }
}
exports.LogRepository = LogRepository;
