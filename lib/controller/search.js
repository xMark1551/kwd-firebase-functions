"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchController = void 0;
const handler_1 = require("../middleware/handler");
const reponse_1 = require("../utils/reponse");
const algolia_search_service_1 = require("../services/algolia/algolia.search.service");
exports.searchController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const user = req.user;
    const response = await algolia_search_service_1.searchService.search({ ...query, user });
    (0, reponse_1.ok)(res, response, "Search results fetched");
});
