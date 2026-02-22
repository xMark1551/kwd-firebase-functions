"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.docToAlgoliaObject = docToAlgoliaObject;
const toDateMs_1 = __importDefault(require("../utils/toDateMs"));
function docToAlgoliaObject(collection, id, data) {
    return {
        objectID: id,
        source: collection,
        hasDate: 1,
        dateMs: (0, toDateMs_1.default)(data.date || data.createdAt || data.publishedAt || null) ?? 0,
        visibility: data.status && data.status === "Published" ? "public" : "private",
        ...data,
    };
}
