"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.AlgoliaSearchService = void 0;
const algolia_client_1 = require("./algolia.client");
const client = (0, algolia_client_1.createAlgoliaClient)(process.env.ALGOLIA_ADMIN_KEY);
class AlgoliaSearchService {
    constructor(appId, searchKey) {
        if (!appId || !searchKey) {
            throw new Error("Missing ALGOLIA_APP_ID or ALGOLIA_SEARCH_KEY");
        }
        this.indexes = {
            global: client.initIndex("global_search"),
        };
    }
    buildFilters({ role = "client", sources, category, }) {
        const filters = [];
        // visibility
        if (role === "client") {
            filters.push("visibility:public");
        }
        else {
            filters.push("(visibility:public OR visibility:admin)");
        }
        // sources
        if (sources?.length) {
            filters.push(`(${sources.map((s) => `source:${s}`).join(" OR ")})`);
        }
        // category
        if (category) {
            filters.push(`category:${category}`);
        }
        return filters.join(" AND ");
    }
    async search(args) {
        const { query = "", limit = 2, page = 1, sources = [], category = "" } = args;
        const indexKey = "global";
        const filters = this.buildFilters({
            role: "client",
            sources,
            category,
        });
        const res = await this.indexes[indexKey].search(query, {
            hitsPerPage: limit,
            page: page - 1,
            filters,
        });
        const items = res.hits.map((item) => ({
            ...item,
            __index: indexKey,
            id: item.objectID,
            title: item.title + (item.year ? ` (${item.year})` : ""),
            category: item.category || "Database",
            source: item.source || item.__index,
        }));
        return {
            items,
            totalResults: res.nbHits,
            totalPages: res.nbPages,
            page,
        };
    }
}
exports.AlgoliaSearchService = AlgoliaSearchService;
exports.searchService = new AlgoliaSearchService(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_SEARCH_KEY);
