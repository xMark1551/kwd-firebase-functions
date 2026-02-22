"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateRangeForYearOrMonth = exports.groupedByMonth = exports.getMonthKey = void 0;
const getMonthKey = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    const [year, month] = d.toISOString().split("T")[0].split("-");
    return `${year}-${month}`;
};
exports.getMonthKey = getMonthKey;
const groupedByMonth = (docs) => {
    const grouped = {};
    docs.forEach((doc) => {
        // Get month key
        const monthKey = (0, exports.getMonthKey)(doc.date);
        // Count per month
        grouped[monthKey] = (grouped[monthKey] || 0) + 1;
    });
    // Convert object to array of { monthKey, count }
    const result = Object.entries(grouped).map(([monthKey, count]) => ({
        monthKey,
        count,
    }));
    // Optional: sort ascending by month
    result.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    return result;
};
exports.groupedByMonth = groupedByMonth;
const getDateRangeForYearOrMonth = (year, month) => {
    const start = month
        ? new Date(year, month - 1, 1) // month is 1-12
        : new Date(year, 0, 1); // Jan 1
    const end = month
        ? new Date(year, month, 1) // next month start
        : new Date(year + 1, 0, 1); // next year start
    return { start, end };
};
exports.getDateRangeForYearOrMonth = getDateRangeForYearOrMonth;
