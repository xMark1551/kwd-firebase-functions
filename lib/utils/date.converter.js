"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateRangeForYearOrMonth = exports.groupedByMonth = exports.getMonthKey = void 0;
/**
 * Returns a month key in format "YYYY-MM"
 *
 * Example return:
 * "2026-02"
 *
 * Accepts:
 * - Firestore Timestamp
 * - Date
 * - ISO string
 */
const getMonthKey = (date) => {
    // Convert Firestore Timestamp or string into Date
    const d = date?.toDate ? date.toDate() : new Date(date);
    // Extract year and month from ISO format
    const [year, month] = d.toISOString().split("T")[0].split("-");
    // Return formatted key: YYYY-MM
    return `${year}-${month}`;
};
exports.getMonthKey = getMonthKey;
/**
 * Groups documents by month and counts how many items per month.
 *
 * Returns:
 * [
 *   { monthKey: "2026-01", count: 5 },
 *   { monthKey: "2026-02", count: 8 }
 * ]
 */
const groupedByMonth = (docs) => {
    const grouped = {};
    docs.forEach((doc) => {
        // Convert document date to "YYYY-MM"
        const monthKey = (0, exports.getMonthKey)(doc.date);
        // Increase count for that month
        grouped[monthKey] = (grouped[monthKey] || 0) + 1;
    });
    // Convert object into array format
    const result = Object.entries(grouped).map(([monthKey, count]) => ({
        monthKey, // "YYYY-MM"
        count, // number of items in that month
    }));
    // Sort ascending by month (oldest → newest)
    result.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    return result;
};
exports.groupedByMonth = groupedByMonth;
/**
 * Returns a date range used for querying Firestore.
 *
 * Returns:
 * {
 *   start: Date,
 *   end: Date
 * }
 *
 * Examples:
 *
 * getDateRangeForYearOrMonth(2026)
 * → { start: Jan 1 2026, end: Jan 1 2027 }
 *
 * getDateRangeForYearOrMonth(2026, 2)
 * → { start: Feb 1 2026, end: Mar 1 2026 }
 */
const getDateRangeForYearOrMonth = (year, month) => {
    const start = month
        ? new Date(year, month - 1, 1) // First day of selected month
        : new Date(year, 0, 1); // First day of selected year
    const end = month
        ? new Date(year, month, 1) // First day of next month
        : new Date(year + 1, 0, 1); // First day of next year
    return { start, end };
};
exports.getDateRangeForYearOrMonth = getDateRangeForYearOrMonth;
