// import { redis } from "../lib/redis";

import { getRedis, isRedisAvailable } from "../lib/redis";

/**
 * Cache Aside Pattern
 * key: cache key
 * ttlSeconds: time to live in seconds
 * fetcher: function that fetches fresh data from DB
 */
export async function cacheAside<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  // 1️⃣ Try cache
  if (!isRedisAvailable()) return fetcher();

  const redis = getRedis();
  if (!redis) return fetcher();

  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2️⃣ Fetch fresh
  const fresh = await fetcher();

  // 3️⃣ Save cache
  await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);

  return fresh;
}

export const cacheService = {
  get: async (key: string) => {
    if (!isRedisAvailable()) return null;

    const redis = getRedis();
    if (!redis) return null;

    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  set: async (key: string, value: any, ttl = 3600) => {
    if (!isRedisAvailable()) return null;

    const redis = getRedis();
    if (!redis) return null;

    await redis.setex(key, ttl, JSON.stringify(value));
  },

  invalidate: async (key: string) => {
    if (!isRedisAvailable()) return null;
    const redis = getRedis();
    if (!redis) return null;
    await redis.del(key);
  },

  invalidatePattern: async (pattern: string) => {
    if (!isRedisAvailable()) return null;
    const redis = getRedis();
    if (!redis) return null;

    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  },
};
