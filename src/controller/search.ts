import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { ok } from "../utils/reponse";
import { searchService } from "../services/algolia/algolia.search.service";

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;
  const user = req.user;

  const response = await searchService.search({ ...query, user });

  ok(res, response, "Search results fetched");
});
