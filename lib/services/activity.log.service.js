"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogService = exports.ActivityLogService = void 0;
const firebase_1 = require("../config/firebase");
const activity_log_repository_1 = require("../repositories/activity.log.repository");
const cache_1 = require("../utils/cache");
const logger_service_1 = require("./logger.service");
const filter_builder_1 = require("../utils/filter.builder");
const logRepo = new activity_log_repository_1.ActivityLogRepository(firebase_1.db);
class ActivityLogService {
    constructor(logRepo, logger, cache, prefix = "logs") {
        this.logRepo = logRepo;
        this.logger = logger;
        this.cache = cache;
        this.prefix = prefix;
    }
    key(type, params) {
        return this.cache.keyBuilder(this.prefix, type, params);
    }
    async invalidateLogsCache() {
        await this.cache.invalidatePattern(`${this.prefix}:*`);
    }
    async createLog(log) {
        const result = await this.logRepo.create(log);
        this.logger.info("Activity log created successfully", { result });
        await this.invalidateLogsCache();
        return result;
    }
    async info(action, message, meta) {
        return this.createLog({
            level: "INFO",
            action,
            status: 200,
            message,
            meta,
        });
    }
    async error(action, message, status = 500, meta) {
        return this.createLog({
            level: "ERROR",
            action,
            status,
            message,
            meta,
        });
    }
    async warn(action, message, status = 400, meta) {
        return this.createLog({
            level: "WARN",
            action,
            status,
            message,
            meta,
        });
    }
    async debug(action, message, status = 0, meta) {
        return this.createLog({
            level: "DEBUG",
            action,
            status,
            message,
            meta,
        });
    }
    async cleanupOldLogs(retentionDays = 0, batchSize = 500) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        this.logger.info(`Cleaning up logs older than ${retentionDays} days`, {
            cutoffDate: cutoffDate.toISOString(),
        });
        let totalDeleted = 0;
        while (true) {
            const snapshot = await this.logRepo.getOldLogs(cutoffDate, batchSize);
            if (snapshot.empty)
                break;
            await this.logRepo.deleteDocs(snapshot.docs);
            totalDeleted += snapshot.size;
            this.logger.info(`Deleted ${snapshot.size} logs in this batch`, {
                totalDeleted,
            });
            // If fewer than batchSize, we are done
            if (snapshot.size < batchSize)
                break;
        }
        this.logger.info("Cleanup completed", { totalDeleted });
        await this.invalidateLogsCache();
        return totalDeleted;
    }
    async getPaginatedLogs(query) {
        const { page, pageSize, cursor, filters: activityLogFilters } = query;
        const filters = (0, filter_builder_1.filterBuilder)({ ...activityLogFilters });
        const key = this.key("list", { ...query });
        return await this.cache.cacheAside(key, () => this.logRepo.getPaginated({ page, pageSize, cursor, filters }));
    }
    async getPaginatedLogsTotalCount(activityLogFilters) {
        const filters = (0, filter_builder_1.filterBuilder)({ ...activityLogFilters });
        const key = this.key("count");
        return await this.cache.cacheAside(key, () => this.logRepo.totalCount(filters));
    }
    async getPaginatedLogsWithTotalCount(query) {
        const { filters } = query;
        // 1. Fetch count
        const total = await this.getPaginatedLogsTotalCount({ ...filters });
        const totalPageCount = Math.ceil(total / query.pageSize);
        this.logger.info("Total page count", { totalResults: total, totalPageCount });
        // 2. Get paginated inquiries
        const logs = await this.getPaginatedLogs(query);
        return { ...logs, meta: { totalResults: total, totalPages: totalPageCount } };
    }
    async clearAllLogs() {
        await this.cleanupOldLogs();
        await this.invalidateLogsCache();
        return;
    }
}
exports.ActivityLogService = ActivityLogService;
exports.activityLogService = new ActivityLogService(logRepo, logger_service_1.logService.withContext("PostService"), cache_1.cacheService);
