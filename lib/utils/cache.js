"use strict";
// import { redis } from "../lib/redis";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
exports.cacheAside = cacheAside;
const redis_1 = require("../lib/redis");
/**
 * Cache Aside Pattern
 * key: cache key
 * ttlSeconds: time to live in seconds
 * fetcher: function that fetches fresh data from DB
 */
async function cacheAside(key, ttlSeconds, fetcher) {
    // 1️⃣ Try cache
    if (!(0, redis_1.isRedisAvailable)())
        return fetcher();
    const redis = (0, redis_1.getRedis)();
    if (!redis)
        return fetcher();
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
exports.cacheService = {
    get: async (key) => {
        if (!(0, redis_1.isRedisAvailable)())
            return null;
        const redis = (0, redis_1.getRedis)();
        if (!redis)
            return null;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },
    set: async (key, value, ttl = 3600) => {
        if (!(0, redis_1.isRedisAvailable)())
            return null;
        const redis = (0, redis_1.getRedis)();
        if (!redis)
            return null;
        await redis.setex(key, ttl, JSON.stringify(value));
    },
    invalidate: async (key) => {
        if (!(0, redis_1.isRedisAvailable)())
            return null;
        const redis = (0, redis_1.getRedis)();
        if (!redis)
            return null;
        await redis.del(key);
    },
    invalidatePattern: async (pattern) => {
        if (!(0, redis_1.isRedisAvailable)())
            return null;
        const redis = (0, redis_1.getRedis)();
        if (!redis)
            return null;
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
