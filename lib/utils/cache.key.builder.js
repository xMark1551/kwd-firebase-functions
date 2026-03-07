"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheKeyBuilderWithPrefix = exports.cacheKeyBuilder = void 0;
const cacheKeyBuilder = (key) => `cache:${key}`;
exports.cacheKeyBuilder = cacheKeyBuilder;
const cacheKeyBuilderWithPrefix = (prefix, params) => {
    const normalized = Object.fromEntries(Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null) // strip undefined/null
        .sort(([a], [b]) => a.localeCompare(b)));
    return `${prefix}:${JSON.stringify(normalized)}`;
};
exports.cacheKeyBuilderWithPrefix = cacheKeyBuilderWithPrefix;
