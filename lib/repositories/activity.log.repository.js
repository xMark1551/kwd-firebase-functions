"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogRepository = void 0;
const base_repository_1 = require("./base.repository");
const collection_name_1 = require("../const/collection.name");
const logger_service_1 = require("../services/logger.service");
class ActivityLogRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, collection_name_1.ACTIVITY_LOG_COLLECTION);
        // Default retention period in days
        this.DEFAULT_RETENTION_DAYS = 90;
    }
    /**
     * Delete logs older than specified days
     * @param retentionDays Number of days to keep logs (default: 90)
     * @param batchSize Number of logs to delete per batch (default: 500)
     * @returns Number of logs deleted
     */
    async getOldLogs(cutoffDate, limit) {
        return this.col().where("createdAt", "<", cutoffDate).limit(limit).get();
    }
    async deleteDocs(docs) {
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
    async getOldLogsCount(retentionDays = this.DEFAULT_RETENTION_DAYS) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const snapshot = await this.db.collection(this.collectionName).where("timestamp", "<", cutoffDate).count().get();
            return snapshot.data().count;
        }
        catch (error) {
            logger_service_1.logService.error("Failed to get old logs count", { error: error.message });
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
            logger_service_1.logService.error("Failed to get log stats", { error: error.message });
            return {
                total: 0,
                byLevel: { info: 0, warning: 0, error: 0 },
                oldLogsCount: 0,
            };
        }
    }
}
exports.ActivityLogRepository = ActivityLogRepository;
