"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.docToAlgoliaObject = docToAlgoliaObject;
const to_date_ms_1 = __importDefault(require("./to.date.ms"));
function docToAlgoliaObject(collection, id, data) {
    return {
        objectID: id,
        source: collection,
        hasDate: 1,
        dateMs: (0, to_date_ms_1.default)(data.createdAt || null) ?? 0,
        visibility: data.status && data.status === "Published" ? "public" : "private",
        ...data,
    };
}
