import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/handler";

import { transparencyService } from "../services/transparency.service";

export const createTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  await transparencyService.createTransparency(user, data, fileToUpload);

  res.status(200).json({
    ok: true,
  });
});

export const createTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;

  const response = await transparencyService.createTransparencyFolder(user, data);

  res.status(200).json({
    ok: true,
    data: { id: response },
  });
});

export const getPaginatedTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getPaginatedTransparencyWithCount(query);

  res.status(200).json({
    ok: true,
    items: response.items,
    meta: response.meta,
    nextCursor: response.nextCursor,
  });
});

export const getTotalTransparencyCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getTotalTransparencyCount(query);

  res.status(200).json({ count: response });
});

export const getTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getTransparencyFolder(query);

  res.status(200).json(response);
});

export const getTransparencyWithFiltersController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await transparencyService.getTransparencyWithFilters(query);

  res.status(200).json(response);
});

export const patchTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  await transparencyService.patchTransparency(id, data, fileToUpload);

  res.status(200).json({
    ok: true,
  });
});

export const patchTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body;

  await transparencyService.updateTransparencyFolder(id, data);

  res.status(200).json({
    ok: true,
  });
});

export const deleteTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  await transparencyService.deleteTransparency(id);

  res.status(200).json({
    ok: true,
  });
});

export const bulkDeleteTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  await transparencyService.bulkDeleteTransparency(ids);

  res.status(200).json({
    ok: true,
  });
});

export const deleteTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  await transparencyService.deleteTransparencyFolder(id);

  res.status(200).json({
    ok: true,
  });
});

export const getTransparencyCountThisYearController = asyncHandler(async (req: Request, res: Response) => {
  const response = await transparencyService.fetchTransparencyThisYear();

  res.status(200).json(response);
});
