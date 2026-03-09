"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterBuilder = exports.buildDateRangeFilters = exports.buildNormalFilters = void 0;
const date_converter_1 = require("./date.converter");
const buildNormalFilters = (filter) => {
    // If category is latest then remove category filter to automatically fetch latest
    if (filter.category === "latest") {
        delete filter.category;
    }
    if (filter.level === "ALL") {
        delete filter.level;
    }
    const filters = [];
    Object.entries(filter).forEach(([field, value]) => {
        if (value === undefined || value === null)
            return;
        if (typeof value === "string" && value.trim() === "")
            return;
        if (typeof value === "string") {
            filters.push({ field, op: "==", value });
        }
        if (typeof value === "number") {
            filters.push({ field, op: "==", value });
        }
        if (typeof value === "boolean") {
            filters.push({ field, op: "==", value });
        }
    });
    return filters;
};
exports.buildNormalFilters = buildNormalFilters;
const buildDateRangeFilters = (filter) => {
    const { year, month } = filter;
    const filters = [];
    if (typeof year === "number") {
        const { start, end } = (0, date_converter_1.getDateRangeForYearOrMonth)(year, month);
        filters.push({ field: "createdAt", op: ">=", value: start }, { field: "createdAt", op: "<=", value: end });
    }
    return filters;
};
exports.buildDateRangeFilters = buildDateRangeFilters;
const filterBuilder = (filter) => {
    const { year, month, ...rest } = filter;
    // 1. Handle normal equality filters (strings)
    const normalFilters = (0, exports.buildNormalFilters)(rest);
    // 2. Handle year/month date range
    const dateRangeFilters = (0, exports.buildDateRangeFilters)({ year, month });
    return [...normalFilters, ...dateRangeFilters];
};
exports.filterBuilder = filterBuilder;
