import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";

import {
  createPost,
  getPaginatedPost,
  getTotalPostCount,
  getPostById,
  getPostArchiveCountByMonth,
  getPostCategoryCount,
  getPostCurrentMonthCount,
  getFeaturedPost,
  patchPost,
  setFeaturedPost,
  deletePost,
  bulkDeletePosts,
} from "../services/post.service";

export const createPostController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;
  const filesToUpload = req.filesToUpload;

  await createPost(user, data, filesToUpload);

  res.status(200).json({
    ok: true,
    message: "Post created",
  });
});

export const getPaginatedPostController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await getPaginatedPost(query);

  res.status(200).json({
    ok: true,
    items: response.items,
    meta: response.meta,
  });
});

export const getTotalPostCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await getTotalPostCount(query);

  res.status(200).json({ count: response });
});

export const getPostByIdController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const response = await getPostById(id);

  res.status(200).json(response);
});

export const getPostArchiveCountByMonthController = asyncHandler(async (req: Request, res: Response) => {
  const response = await getPostArchiveCountByMonth();

  res.status(200).json(response);
});

export const getPostCategoryCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await getPostCategoryCount();

  res.status(200).json(response);
});

export const getPostCurrentMonthCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await getPostCurrentMonthCount();

  res.status(200).json(response);
});

export const getFeaturedPostController = asyncHandler(async (req: Request, res: Response) => {
  const response = await getFeaturedPost();

  res.status(200).json(response);
});

export const patchPostController = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const { id } = req.params as { id: string };
  const filesToUpload = req.filesToUpload;

  await patchPost(id, data, filesToUpload);

  res.status(200).json({
    ok: true,
    message: "Update created",
  });
});

export const setFeaturedPostController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const response = await setFeaturedPost(id);

  res.status(200).json(response);
});

export const deletePostController = asyncHandler(async (req: Request<{ id: string }>, res) => {
  const { id } = req.params;

  await deletePost(id);
  res.status(200).json({
    ok: true,
    message: "Post deleted",
  });
});

export const bulkDeletePostsController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  await bulkDeletePosts(ids);

  res.status(200).json({
    ok: true,
    message: "Post deleted",
  });
});
