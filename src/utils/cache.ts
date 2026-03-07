import Redis from "ioredis";

type CacheValue = unknown;

interface CacheOptions {
  ttl?: number;
}

export class CacheService {
  private readonly redis: Redis;
  private readonly prefix: string;
  readonly defaultTTL: number;
  private redisAvailable = false;

  constructor(
    options: {
      prefix?: string;
      defaultTTL?: number;
      redisUrl?: string;
    } = {},
  ) {
    this.prefix = options.prefix ?? process.env.CACHE_PREFIX ?? "app";
    this.defaultTTL = options.defaultTTL ?? 3600;

    this.redis = new Redis(options.redisUrl ?? process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
      retryStrategy(times) {
        if (times > 1) {
          // console.log("❌ Redis disabled after 5 retries");
          return null; // stop reconnecting
        }
        return Math.min(times * 200, 2000);
      },

      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: false,
    });

    this.redis.on("connect", () => {
      this.redisAvailable = true;
      // console.log("✅ Redis connected");
    });

    this.redis.on("error", (err) => {
      this.redisAvailable = false;
      // console.error("Redis error:", err);
    });

    this.redis.on("end", () => {
      this.redisAvailable = false;
      // console.log("❌ Redis disconnected");
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                    LOCK                                     */
  /* -------------------------------------------------------------------------- */

  private async acquireLock(key: string, ttl = 10): Promise<boolean> {
    const lockKey = this.buildKey(`lock:${key}`);
    const result = await this.redis.set(lockKey, "1", "EX", ttl, "NX");
    return result === "OK";
  }

  private async releaseLock(key: string): Promise<void> {
    const lockKey = this.buildKey(`lock:${key}`);
    await this.redis.del(lockKey);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Key Utilities                                */
  /* -------------------------------------------------------------------------- */

  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  public keyBuilder(prefix: string, id: string, suffix?: Record<string, unknown>): string {
    const normalized = Object.fromEntries(
      Object.entries(suffix ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .sort(([a], [b]) => a.localeCompare(b)),
    );

    if (Object.keys(normalized).length === 0) {
      return `${prefix}:${id}`; // fixed: now includes this.prefix
    }

    return `${prefix}:${id}:${JSON.stringify(normalized)}`; // fixed
  }

  /* -------------------------------------------------------------------------- */
  /*                                    GET                                     */
  /* -------------------------------------------------------------------------- */

  async get<T extends CacheValue>(key: string): Promise<T | null> {
    // fixed: string not any
    if (!this.redisAvailable) return null;

    try {
      const data = await this.redis.get(this.buildKey(key));
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      console.error("Cache GET error:", error);
      return null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                    SET                                     */
  /* -------------------------------------------------------------------------- */

  async set(key: string, value: CacheValue, options?: CacheOptions): Promise<void> {
    // fixed: string not any
    if (!this.redisAvailable) return;

    try {
      const ttl = options?.ttl ?? this.defaultTTL;
      await this.redis.set(this.buildKey(key), JSON.stringify(value), "EX", ttl);
    } catch (error) {
      console.error("Cache SET error:", error);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                    DEL                                     */
  /* -------------------------------------------------------------------------- */

  async del(key: string): Promise<void> {
    // fixed: string not any
    if (!this.redisAvailable) return;

    try {
      await this.redis.del(this.buildKey(key));
    } catch (error) {
      console.error("Cache DEL error:", error);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             INVALIDATE PATTERN                             */
  /* -------------------------------------------------------------------------- */

  async invalidatePattern(pattern: string): Promise<void> {
    // fixed: string not any
    if (!this.redisAvailable) return;

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
    } catch (error) {
      console.error("Cache INVALIDATE error:", error);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              CACHE ASIDE HELPER                            */
  /* -------------------------------------------------------------------------- */

  async cacheAside<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions & { lockTtl?: number; retryDelay?: number; maxRetries?: number },
  ): Promise<T> {
    if (!this.redisAvailable) return fetcher();

    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

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
      const recheck = await this.get<T>(key);
      if (recheck !== null) return recheck;

      const fresh = await fetcher();
      await this.set(key, fresh, options);
      return fresh;
    } finally {
      await this.releaseLock(key);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                  SHUTDOWN                                  */
  /* -------------------------------------------------------------------------- */

  async disconnect(): Promise<void> {
    if (!this.redisAvailable) return;
    await this.redis.quit();
  }
}

/* -------------------------------------------------------------------------- */
/*                              Singleton Export                               */
/* -------------------------------------------------------------------------- */

export const cacheService = new CacheService();
