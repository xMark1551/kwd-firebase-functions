import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { searchService } from "../services/algolia/algolia.search.service";

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;
  const user = req.user;

  const response = await searchService.search({ ...query, user });

  console.log("response", response);

  res.status(200).json(response);
});
