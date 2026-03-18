import { db } from "../config/firebase";
import { getContext } from "../context/request-context";
import { ActivityLogRepository } from "../repositories/activity.log.repository";

import { CacheService, cacheService } from "../utils/cache";
import { logService, LogService } from "./logger.service";

import { filterBuilder } from "../utils/filter.builder";

import type {
  GetPaginatedActivityLogs,
  CreateActivityLog,
  Target,
  ActivityLogFilter,
} from "../validation/activity-log.schema";
import type { PaginatedResult } from "../repositories/base.repository";
import type { ActivityLog } from "../model/activity.log.model.schema";

type PaginatedResultWithCount = Omit<PaginatedResult<ActivityLog>, "meta"> & {
  meta: { totalResults: number; totalPages: number };
};

const logRepo = new ActivityLogRepository(db);

export class ActivityLogService {
  constructor(
    private readonly logRepo: ActivityLogRepository,
    private readonly logger: LogService,
    private readonly cache: CacheService,
    private readonly prefix = "logs",
  ) {}

  private get ctx() {
    return getContext(); // ✅ called fresh on every method invocation
  }

  private key(type: string, params?: Record<string, unknown>) {
    return this.cache.keyBuilder(this.prefix, type, params);
  }

  private async invalidateLogsCache() {
    await this.cache.invalidatePattern(`${this.prefix}:*`);
  }

  async createLog(log: CreateActivityLog) {
    const result = await this.logRepo.create(log);

    this.logger.info("Activity log created successfully", { result });

    await this.invalidateLogsCache();

    return result;
  }

  async success(action: string, target: Target) {
    return this.createLog({
      severity: "INFO",
      author: this.ctx?.user ?? null,
      action,
      target,
      status: "success",
      code: 200,
    });
  }

  async fail(action: string, target: Target, reason: string, code?: number) {
    return this.createLog({
      severity: "ERROR",
      author: this.ctx?.user ?? null,
      action,
      target,
      status: "fail",
      code: code ?? 400,
      reason,
    });
  }

  async warn(action: string, target: Target, reason: string, code?: number) {
    return this.createLog({
      severity: "WARNING",
      author: this.ctx?.user ?? null,
      action,
      target,
      status: "fail",
      code: code ?? 300,
      reason,
    });
  }

  async cleanupOldLogs(retentionDays: number = 0, batchSize: number = 500) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.info(`Cleaning up logs older than ${retentionDays} days`, {
      cutoffDate: cutoffDate.toISOString(),
    });

    let totalDeleted = 0;

    while (true) {
      const snapshot = await this.logRepo.getOldLogs(cutoffDate, batchSize);

      if (snapshot.empty) break;

      await this.logRepo.deleteDocs(snapshot.docs);

      totalDeleted += snapshot.size;

      this.logger.info(`Deleted ${snapshot.size} logs in this batch`, {
        totalDeleted,
      });

      // If fewer than batchSize, we are done
      if (snapshot.size < batchSize) break;
    }

    this.logger.info("Cleanup completed", { totalDeleted });

    await this.invalidateLogsCache();

    return { totalDeleted, retentionDays, batchSize };
  }

  async getPaginatedLogs(query: GetPaginatedActivityLogs) {
    const { page, pageSize, cursor, filters: activityLogFilters } = query;

    const filters = filterBuilder({ ...activityLogFilters });

    console.log("filters", filters);

    const key = this.key("list", { ...query });

    return await this.cache.cacheAside(key, () => this.logRepo.getPaginated({ page, pageSize, cursor, filters }));
  }

  async getPaginatedLogsTotalCount(activityLogFilters: ActivityLogFilter) {
    const filters = filterBuilder({ ...activityLogFilters });

    const key = this.key("count");
    return await this.cache.cacheAside(key, () => this.logRepo.totalCount(filters));
  }

  async getPaginatedLogsWithTotalCount(query: GetPaginatedActivityLogs): Promise<PaginatedResultWithCount> {
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

export const activityLogService = new ActivityLogService(logRepo, logService, cacheService);
