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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgoliaIndexService = void 0;
const admin = __importStar(require("firebase-admin"));
const algolia_client_1 = require("./algolia.client");
const collection_name_1 = require("../../const/collection.name");
const client = (0, algolia_client_1.createAlgoliaClient)(process.env.ALGOLIA_ADMIN_KEY);
const globalIndex = client.initIndex("global_search");
class AlgoliaIndexService {
    async backfillGlobal() {
        const db = admin.firestore();
        let totalUploaded = 0;
        const collections = [collection_name_1.NEWS_AND_UPDATES_COLLECTION, collection_name_1.TRANSPARENCY_SEAL_COLLECTION];
        for (const collection of collections) {
            const snap = await db.collection(collection).get();
            const objects = [];
            snap.forEach((doc) => {
                const data = doc.data();
                objects.push({
                    objectID: `${collection}_${doc.id}`,
                    ...data,
                });
            });
            const chunkSize = 1000;
            for (let i = 0; i < objects.length; i += chunkSize) {
                const chunk = objects.slice(i, i + chunkSize);
                await globalIndex.saveObjects(chunk);
                totalUploaded += chunk.length;
            }
        }
        return { totalUploaded };
    }
}
exports.AlgoliaIndexService = AlgoliaIndexService;
