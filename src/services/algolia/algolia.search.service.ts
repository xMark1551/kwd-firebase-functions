import { createAlgoliaClient } from "./algolia.client";

import { generatePath } from "../../utils/generatePath";

import type { SearchIndex } from "algoliasearch";
import type { AuthedUser } from "../../validation/auth.schema";

const client = createAlgoliaClient(process.env.ALGOLIA_ADMIN_KEY!);

export type IndexKey = "global";

export interface SearchArgs {
  user?: AuthedUser;
  query: string;
  limit?: number;
  page?: number;
  sources?: string[];
  category?: string;
}

export interface FileData {
  name: string;
  url: string;
}

export interface SearchResult {
  objectID: string;
  title: string;
  description: string;
  source?: string;
  slug?: string;
  file?: FileData | null;
  category?: string;
  dateMs?: number;
}

export interface SearchResponse {
  items: SearchResult[];
  totalResults: number;
  totalPages: number;
  page: number;
}

export class AlgoliaSearchService {
  private indexes: Record<IndexKey, SearchIndex>;

  constructor(appId: string, searchKey: string) {
    if (!appId || !searchKey) {
      throw new Error("Missing ALGOLIA_APP_ID or ALGOLIA_SEARCH_KEY");
    }

    this.indexes = {
      global: client.initIndex("global_search"),
    };
  }

  private buildFilters({
    role = "client",
    sources,
    category,
  }: {
    role?: "admin" | "client";
    sources?: string[];
    category?: string;
  }) {
    const filters: string[] = [];

    // visibility
    if (role === "client") {
      filters.push("visibility:public");
    } else if (role === "admin") {
      filters.push("(visibility:public OR visibility:private)");
    }

    // sources
    if (sources?.length) {
      filters.push(`(${sources.map((s) => `source:${s}`).join(" OR ")})`);
    }

    // category
    if (category) {
      filters.push(`category:${category}`);
    }

    return filters.join(" AND ");
  }

  async search(args: SearchArgs): Promise<SearchResponse> {
    const { query = "", limit = 2, page = 1, sources = [], category = "", user = { admin: false } } = args;

    const indexKey = "global";

    const role = user?.admin ? "admin" : "client";

    const filters = this.buildFilters({
      role,
      sources,
      category,
    });

    const res = await this.indexes[indexKey].search(query, {
      hitsPerPage: limit,
      page: page - 1,
      filters,
    });

    const items = res.hits.map((item: any) => ({
      ...item,
      __index: indexKey,
      id: item.objectID,
      title: item.title + (item.year ? ` (${item.year})` : ""),
      category: item.category || "Database",
      source: item.source || item.__index,
      path: generatePath({ ...item, role }),
    }));

    return {
      items,
      totalResults: res.nbHits,
      totalPages: res.nbPages,
      page,
    };
  }
}

export const searchService = new AlgoliaSearchService(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_SEARCH_KEY!);
