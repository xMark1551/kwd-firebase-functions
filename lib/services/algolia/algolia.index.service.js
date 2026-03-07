"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.algoliaIndexService = exports.AlgoliaIndexService = void 0;
const algolia_client_1 = require("./algolia.client");
const client = (0, algolia_client_1.createAlgoliaClient)(process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex("global_search");
class AlgoliaIndexService {
    constructor() {
        const appId = process.env.ALGOLIA_APP_ID;
        const adminKey = process.env.ALGOLIA_ADMIN_KEY;
        if (!appId || !adminKey) {
            throw new Error("Missing ALGOLIA_ADMIN_KEY or ALGOLIA_APP_ID");
        }
    }
    async save(object) {
        await index.saveObject(object);
    }
    async delete(objectID) {
        await index.deleteObject(objectID);
    }
}
exports.AlgoliaIndexService = AlgoliaIndexService;
exports.algoliaIndexService = new AlgoliaIndexService();
