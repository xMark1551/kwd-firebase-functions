import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/handler";

import {
  createTransparency,
  createTransparencyFolder,
  getPaginatedTransparency,
  getTotalTransparencyCount,
  getTransparencyFolder,
  getTransparencyWithFilters,
  patchTransparency,
  updateTransparencyFolder,
  deleteTransparency,
  bulkDeleteTransparency,
  deleteTransparencyFolder,
} from "../services/transparency.service";

export const createTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  await createTransparency(user, data, fileToUpload);

  res.status(200).json({
    ok: true,
  });
});

export const createTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;

  const response = await createTransparencyFolder(user, data);

  res.status(200).json({
    ok: true,
    data: { id: response },
  });
});

export const getPaginatedTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await getPaginatedTransparency(query);

  res.status(200).json({
    ok: true,
    items: response.items,
    meta: response.meta,
  });
});

export const getTotalTransparencyCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await getTotalTransparencyCount(query);

  res.status(200).json({ count: response });
});

export const getTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await getTransparencyFolder(query);

  res.status(200).json(response);
});

export const getTransparencyWithFiltersController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  console.log("query", query);

  const response = await getTransparencyWithFilters(query);

  console.log("response", response);

  res.status(200).json(response);
});

export const patchTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  await patchTransparency(id, data, fileToUpload);

  res.status(200).json({
    ok: true,
  });
});

export const patchTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body;

  await updateTransparencyFolder(id, data);

  res.status(200).json({
    ok: true,
  });
});

export const deleteTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  await deleteTransparency(id);

  res.status(200).json({
    ok: true,
  });
});

export const bulkDeleteTransparencyController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  await bulkDeleteTransparency(ids);

  res.status(200).json({
    ok: true,
  });
});

export const deleteTransparencyFolderController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  await deleteTransparencyFolder(id);

  res.status(200).json({
    ok: true,
  });
});
