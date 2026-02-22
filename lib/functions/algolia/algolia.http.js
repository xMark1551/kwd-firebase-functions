"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewsCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const algolia_backfill_http_1 = require("../../services/algolia/algolia.backfill.http");
const auth_1 = require("../../utils/auth");
exports.createNewsCallable = (0, https_1.onCall)(async (request) => {
    // 🔐 admin guard (v2)
    (0, auth_1.requireAdmin)(request);
    return await (0, algolia_backfill_http_1.backfillAlgoliaGlobal)();
});
