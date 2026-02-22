import Redis from "ioredis";

// export const redis = new Redis(process.env.REDIS_URL!, {
//   maxRetriesPerRequest: null,
// });

let redis: Redis | null = null;
let redisAvailable = false;

export const initRedis = () => {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),

    // IMPORTANT: stop infinite retry
    retryStrategy(times) {
      if (times > 5) {
        console.log("❌ Redis disabled after 5 retries");
        return null; // stop reconnecting
      }
      return Math.min(times * 200, 2000);
    },

    // stop waiting commands forever
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on("connect", () => {
    redisAvailable = true;
    console.log("✅ Redis connected");
  });

  redis.on("error", (err: any) => {
    redisAvailable = false;
    console.log("⚠️ Redis unavailable:", err.code);
  });

  redis.on("end", () => {
    redisAvailable = false;
    console.log("❌ Redis disconnected");
  });

  redis.connect().catch(() => {});
};

export const getRedis = () => redis;
export const isRedisAvailable = () => redisAvailable;
