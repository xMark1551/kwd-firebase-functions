"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchController = void 0;
const handler_1 = require("../middleware/handler");
const algolia_search_service_1 = require("../services/algolia/algolia.search.service");
exports.searchController = (0, handler_1.asyncHandler)(async (req, res) => {
    const query = req.validatedQuery;
    const response = await algolia_search_service_1.searchService.search(query);
    console.log("response", response);
    res.status(200).json(response);
});
