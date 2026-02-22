"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisAvailable = exports.getRedis = exports.initRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// export const redis = new Redis(process.env.REDIS_URL!, {
//   maxRetriesPerRequest: null,
// });
let redis = null;
let redisAvailable = false;
const initRedis = () => {
    redis = new ioredis_1.default({
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
    redis.on("error", (err) => {
        redisAvailable = false;
        console.log("⚠️ Redis unavailable:", err.code);
    });
    redis.on("end", () => {
        redisAvailable = false;
        console.log("❌ Redis disconnected");
    });
    redis.connect().catch(() => { });
};
exports.initRedis = initRedis;
const getRedis = () => redis;
exports.getRedis = getRedis;
const isRedisAvailable = () => redisAvailable;
exports.isRedisAvailable = isRedisAvailable;
