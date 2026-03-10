"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class CacheService {
    constructor(options = {}) {
        this.redisAvailable = false;
        this.prefix = options.prefix ?? process.env.CACHE_PREFIX ?? "app";
        this.defaultTTL = options.defaultTTL ?? 3600;
        this.redis = new ioredis_1.default(options.redisUrl ?? process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
            retryStrategy(times) {
                if (times > 5) {
                    console.log("❌ Redis disabled after 5 retries");
                    return null; // stop reconnecting
                }
                return Math.min(times * 200, 2000);
            },
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: false,
        });
        this.redis.on("connect", () => {
            this.redisAvailable = true;
            console.log("✅ Redis connected..");
        });
        this.redis.on("error", (err) => {
            this.redisAvailable = false;
            console.error("❌ Redis error:", err);
        });
        this.redis.on("end", () => {
            this.redisAvailable = false;
            console.log("❌ Redis disconnected");
        });
    }
    /* -------------------------------------------------------------------------- */
    /*                                    LOCK                                     */
    /* -------------------------------------------------------------------------- */
    async acquireLock(key, ttl = 10) {
        const lockKey = this.buildKey(`lock:${key}`);
        const result = await this.redis.set(lockKey, "1", "EX", ttl, "NX");
        return result === "OK";
    }
    async releaseLock(key) {
        const lockKey = this.buildKey(`lock:${key}`);
        await this.redis.del(lockKey);
    }
    /* -------------------------------------------------------------------------- */
    /*                               Key Utilities                                */
    /* -------------------------------------------------------------------------- */
    buildKey(key) {
        return `${this.prefix}:${key}`;
    }
    keyBuilder(prefix, id, suffix) {
        const normalized = Object.fromEntries(Object.entries(suffix ?? {})
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .sort(([a], [b]) => a.localeCompare(b)));
        if (Object.keys(normalized).length === 0) {
            return `${prefix}:${id}`; // fixed: now includes this.prefix
        }
        return `${prefix}:${id}:${JSON.stringify(normalized)}`; // fixed
    }
    /* -------------------------------------------------------------------------- */
    /*                                    GET                                     */
    /* -------------------------------------------------------------------------- */
    async get(key) {
        // fixed: string not any
        if (!this.redisAvailable)
            return null;
        try {
            const data = await this.redis.get(this.buildKey(key));
            console.log("Redis Hit Cache", data);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error("Cache GET error:", error);
            return null;
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                                    SET                                     */
    /* -------------------------------------------------------------------------- */
    async set(key, value, options) {
        // fixed: string not any
        if (!this.redisAvailable)
            return;
        try {
            const ttl = options?.ttl ?? this.defaultTTL;
            console.log("Redis Set Cache", value);
            await this.redis.set(this.buildKey(key), JSON.stringify(value), "EX", ttl);
        }
        catch (error) {
            console.error("Cache SET error:", error);
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                                    DEL                                     */
    /* -------------------------------------------------------------------------- */
    async del(key) {
        // fixed: string not any
        if (!this.redisAvailable)
            return;
        try {
            await this.redis.del(this.buildKey(key));
        }
        catch (error) {
            console.error("Cache DEL error:", error);
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                             INVALIDATE PATTERN                             */
    /* -------------------------------------------------------------------------- */
    async invalidatePattern(pattern) {
        // fixed: string not any
        if (!this.redisAvailable)
            return;
        try {
            const fullPattern = this.buildKey(pattern);
            let cursor = "0";
            do {
                const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", fullPattern, "COUNT", 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            } while (cursor !== "0");
        }
        catch (error) {
            console.error("Cache INVALIDATE error:", error);
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                              CACHE ASIDE HELPER                            */
    /* -------------------------------------------------------------------------- */
    async cacheAside(key, fetcher, options) {
        if (!this.redisAvailable)
            return fetcher();
        const cached = await this.get(key);
        if (cached !== null)
            return cached;
        const { lockTtl = 10, retryDelay = 100, maxRetries = 5 } = options ?? {};
        const acquired = await this.acquireLock(key, lockTtl);
        if (!acquired) {
            // Another request is fetching — wait and retry
            if (maxRetries <= 0) {
                console.warn(`Cache lock timeout for key: ${key}, falling back to fetcher`);
                return fetcher(); // fallback after max retries
            }
            await new Promise((res) => setTimeout(res, retryDelay));
            return this.cacheAside(key, fetcher, { ...options, maxRetries: maxRetries - 1 });
        }
        try {
            // Re-check cache after acquiring lock (another request may have just populated it)
            const recheck = await this.get(key);
            if (recheck !== null)
                return recheck;
            const fresh = await fetcher();
            await this.set(key, fresh, options);
            return fresh;
        }
        finally {
            await this.releaseLock(key);
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                                  SHUTDOWN                                  */
    /* -------------------------------------------------------------------------- */
    async disconnect() {
        if (!this.redisAvailable)
            return;
        await this.redis.quit();
    }
}
exports.CacheService = CacheService;
/* -------------------------------------------------------------------------- */
/*                              Singleton Export                               */
/* -------------------------------------------------------------------------- */
exports.cacheService = new CacheService();
