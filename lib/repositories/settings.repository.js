"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsRepository = void 0;
const base_repository_1 = require("./base.repository");
const SETTINGS_COLLECTION = "settings";
const LOG_CLEANUP_SETTINGS_DOC = "log_cleanup";
class SettingsRepository extends base_repository_1.FirestoreRepository {
    constructor(db) {
        super(db, SETTINGS_COLLECTION);
    }
    async getLogCleanupSettings() {
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
        return iso;
    }
    async updateLogCleanupSettings(settings) {
        console.log("Updating log cleanup settings with:", settings);
        await this.db.collection(SETTINGS_COLLECTION).doc(LOG_CLEANUP_SETTINGS_DOC).set(settings, { merge: true });
    }
    async updateLastRun(timestamp) {
        await this.db.collection(SETTINGS_COLLECTION).doc(LOG_CLEANUP_SETTINGS_DOC).update({
            lastRun: timestamp,
        });
    }
}
exports.SettingsRepository = SettingsRepository;
