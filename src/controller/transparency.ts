import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { ok } from "../utils/reponse";

import { transparencyService } from "../services/transparency.service";

export const createTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  const response = await transparencyService.createTransparency(user, data, fileToUpload);

  ok(res, response, "Transparency created");
});

export const createTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  const response = await transparencyService.createTransparencyFolder(data);

  ok(res, response, "Transparency folder created");
});

export const getPaginatedTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getPaginatedTransparencyWithCount(query);

  ok(res, response, "Transparency fetched");
});

export const getTotalTransparencyCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getTotalTransparencyCount(query);

  ok(res, response, "Transparency total count fetched");
});

export const getTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getTransparencyFolder(query);

  ok(res, response, "Transparency folder fetched");
});

export const getTransparencyWithFiltersController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getTransparencyWithFilters(query);

  ok(res, response, "Transparency fetched");
});

export const patchTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  const response = await transparencyService.patchTransparency(id, data, fileToUpload);

  ok(res, response, "Transparency updated");
});

export const patchTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body;

  const response = await transparencyService.updateTransparencyFolder(id, data);

  ok(res, response, "Transparency folder updated");
});

export const deleteTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const response = await transparencyService.deleteTransparency(id);

  ok(res, response, "Transparency deleted");
});

export const bulkDeleteTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  const response = await transparencyService.bulkDeleteTransparency(ids);

  ok(res, response, "Transparency bulk deleted");
});

export const deleteTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const response = await transparencyService.deleteTransparencyFolder(id);

  ok(res, response, "Transparency folder deleted");
});

export const getTransparencyCountThisYearController = asyncHandler(async (req: Request, res: Response) => {
  const response = await transparencyService.fetchTransparencyThisYear();

  ok(res, response, "Transparency count fetched");
});
