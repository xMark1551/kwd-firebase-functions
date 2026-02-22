"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillAlgoliaGlobal = void 0;
const admin = __importStar(require("firebase-admin"));
const algoliasearch_1 = __importDefault(require("algoliasearch"));
const algoliaHelper_1 = require("../../utils/algoliaHelper");
const toDateMs_1 = __importDefault(require("../../utils/toDateMs"));
if (!admin.apps.length)
    admin.initializeApp();
const ALGOLIA_APP_ID = "J0QZI9LWOR";
const ALGOLIA_ADMIN_KEY = "e3159cb395991f41b45c6a987fb6745d";
const algoliaClient = (0, algoliasearch_1.default)(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const globalIndex = algoliaClient.initIndex("global_search");
const COLLECTIONS = ["news_and_updates", "transparency_seal"];
const backfillAlgoliaGlobal = async () => {
    const db = admin.firestore();
    let totalUploaded = 0;
    for (const collection of COLLECTIONS) {
        const snap = await db.collection(collection).get();
        // Algolia batch limit is 1000 objects per request (safe to chunk)
        const objects = [];
        snap.forEach((doc) => {
            const id = doc.id;
            const data = doc.data();
            const rawDate = data.createdAt || data.publishedAt || null;
            const dateMs = (0, toDateMs_1.default)(rawDate);
            objects.push({
                objectID: `${collection}_${id}`, // unique across all collections
                ...(0, algoliaHelper_1.docToAlgoliaObject)(collection, id, data),
                type: collection,
                hasDate: dateMs ? 1 : 0,
                dateMs: dateMs ?? 0,
                url: collection === "news_and_updates" ? `/news/${id}` : `/transparency/${id}`,
            });
        });
        // chunk upload
        const chunkSize = 1000;
        for (let i = 0; i < objects.length; i += chunkSize) {
            const chunk = objects.slice(i, i + chunkSize);
            await globalIndex.saveObjects(chunk);
            totalUploaded += chunk.length;
        }
    }
    return {
        totalUploaded,
    };
};
exports.backfillAlgoliaGlobal = backfillAlgoliaGlobal;
