"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.AlgoliaSearchService = void 0;
const algoliasearch_1 = __importDefault(require("algoliasearch"));
class AlgoliaSearchService {
    constructor(appId, searchKey) {
        if (!appId || !searchKey) {
            throw new Error("Missing ALGOLIA_APP_ID or ALGOLIA_SEARCH_KEY");
        }
        this.client = (0, algoliasearch_1.default)(appId, searchKey);
        this.indexes = {
            news: this.client.initIndex("news_and_updates"),
            pages: this.client.initIndex("pages"),
            global: this.client.initIndex("global_search"),
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
    async search(indexKey, args) {
        const { query = "", limit = 2, page = 1, sources = [], category = "" } = args;
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
