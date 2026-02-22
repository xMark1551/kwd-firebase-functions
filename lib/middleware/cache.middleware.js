"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const firebase_1 = require("../config/firebase");
const cache_1 = require("../utils/cache");
const cache = async (req, res) => {
    try {
        const response = await (0, cache_1.cacheAside)("posts:list", // cache key
        3600, // 1 hour TTL (long because we invalidate manually)
        async () => {
            const snap = await firebase_1.db.collection("news_and_updates").get();
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        });
        console.log("response", response);
        // res.status(200).json({
        //   ok: true,
        //   items: response.items,
        //   meta: response.meta,
        // });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch posts");
    }
};
exports.cache = cache;
