"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsRepository = void 0;
// repositories/settings.repository.ts
const firestore_1 = require("firebase-admin/firestore");
const base_repository_1 = require("./base.repository");
const SETTINGS_COLLECTION = "settings";
const LOG_CLEANUP_SETTINGS_DOC = "log_cleanup";
class SettingsRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, SETTINGS_COLLECTION);
        this.defaultSettings = {
            id: LOG_CLEANUP_SETTINGS_DOC,
            enabled: true,
            scheduleExpression: "* * * * *",
            retentionDays: 0,
            batchSize: 500,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now(),
        };
    }
    async getLogCleanupSettings() {
        const doc = await this.col().doc(LOG_CLEANUP_SETTINGS_DOC).get();
        if (!doc.exists) {
            // Return defaults if not set
            return this.defaultSettings;
        }
        const data = doc.data();
        const iso = {
            id: doc.id,
            ...data,
            lastRun: data?.lastRun?.toDate().toISOString(),
            nextRun: data?.nextRun?.toDate().toISOString(),
        };
        return iso;
    }
    async updateLogCleanupSettings(settings) {
        const result = await this.update(LOG_CLEANUP_SETTINGS_DOC, settings);
        return result;
    }
    async updateLastRun(timestamp) {
        await this.db.collection(SETTINGS_COLLECTION).doc(LOG_CLEANUP_SETTINGS_DOC).update({
            lastRun: timestamp,
        });
    }
}
exports.SettingsRepository = SettingsRepository;
