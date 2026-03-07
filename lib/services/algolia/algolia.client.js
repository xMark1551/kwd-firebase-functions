"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlgoliaClient = void 0;
const algoliasearch_1 = __importDefault(require("algoliasearch"));
const createAlgoliaClient = (key) => {
    const appId = process.env.ALGOLIA_APP_ID;
    if (!appId || !key) {
        throw new Error("Missing Algolia credentials");
    }
    return (0, algoliasearch_1.default)(appId, key);
};
exports.createAlgoliaClient = createAlgoliaClient;
