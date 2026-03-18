import { Timestamp } from "firebase-admin/firestore";
import { WhereFilter } from "../repositories/base.repository";
import { getDateRangeForYearOrMonth } from "./date.converter";

type GenericFilter = {
  [key: string]: string | number | boolean | undefined;
  year?: number;
  month?: number;
};

export const buildNormalFilters = (filter: Pick<GenericFilter, keyof GenericFilter>): WhereFilter[] => {
  // If category is latest then remove category filter to automatically fetch latest
  if (filter.category === "latest") {
    delete filter.category;
  }

  if (filter.level === "ALL") {
    delete filter.level;
  }

  const filters: WhereFilter[] = [];

  Object.entries(filter).forEach(([field, value]) => {
    if (value === undefined || value === null) return;

    if (typeof value === "string" && value.trim() === "") return;

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

export const buildDateRangeFilters = (filter: Pick<GenericFilter, "year" | "month">): WhereFilter[] => {
  const { year, month } = filter;

  const filters: WhereFilter[] = [];

  if (typeof year === "number") {
    const { start, end } = getDateRangeForYearOrMonth(year, month);

    filters.push({ field: "createdAt", op: ">=", value: start }, { field: "createdAt", op: "<=", value: end });
  }

  return filters;
};

export const filterBuilder = (filter: GenericFilter): WhereFilter[] => {
  const { year, month, from, to, ...rest } = filter;

  // 1. Handle normal equality filters (strings)
  const normalFilters = buildNormalFilters(rest);

  // 2. Handle year/month date range
  const dateRangeFilters = buildDateRangeFilters({ year, month });

  // 3. Handle date range
  if (from) {
    const start = Timestamp.fromDate(new Date(`${from}T00:00:00+08:00`)); // PHT midnight

    dateRangeFilters.push({ field: "createdAt", op: ">=", value: start });
  }

  if (to) {
    const date = new Date(`${to}T00:00:00+08:00`); // parse as PHT midnight
    date.setDate(date.getDate() + 1); // move to next day PHT
    const end = Timestamp.fromDate(date);
    dateRangeFilters.push({ field: "createdAt", op: "<", value: end });
  }
  return [...normalFilters, ...dateRangeFilters];
};
