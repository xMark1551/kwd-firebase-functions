import { WhereFilter } from "../repositories/base.repository";

import { getDateRangeForYearOrMonth } from "./date.converter";

type GenericFilter = {
  [key: string]: string | number | undefined;
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
  const { year, month, ...rest } = filter;

  // 1. Handle normal equality filters (strings)
  const normalFilters = buildNormalFilters(rest);

  // 2. Handle year/month date range
  const dateRangeFilters = buildDateRangeFilters({ year, month });

  return [...normalFilters, ...dateRangeFilters];
};
