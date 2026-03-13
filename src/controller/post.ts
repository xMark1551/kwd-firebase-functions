import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { postService } from "../services/post.service";

import { ok } from "../utils/reponse";

export const createPostController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;
  const filesToUpload = req.filesToUpload;

  const reponse = await postService.createPost(user, data, filesToUpload);

  ok(res, reponse, "Post created");
});

export const getPaginatedPostController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await postService.getPaginatedPostWithCount(query);

  res.status(200).json({
    ok: true,
    items: response.items,
    meta: response.meta,
    nextCursor: response.nextCursor,
  });

  ok(res, response, "Post fetched");
});

export const getTotalPostCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await postService.getTotalPostCount(query);

  ok(res, { count: response }, "Post count fetched");
});

export const getPostByIdController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const response = await postService.getPostById(id);

  res.status(200).json(response);
});

export const getPostArchiveCountByMonthController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getPostArchiveCountByMonth();

  res.status(200).json(response);
});

export const getPostCategoryCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getPostCategoryCount();

  res.status(200).json(response);
});

export const getPostCurrentMonthCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getPostCurrentMonthCount();

  res.status(200).json(response);
});

export const getFeaturedPostController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getFeaturedPost();

  res.status(200).json(response);
});

export const patchPostController = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const { id } = req.params as { id: string };
  const filesToUpload = req.filesToUpload;

  await postService.patchPost(id, data, filesToUpload);

  res.status(200).json({
    ok: true,
    message: "Update created",
  });
});

export const setFeaturedPostController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const response = await postService.setFeaturedPost(id);

  res.status(200).json(response);
});

export const deletePostController = asyncHandler(async (req: Request<{ id: string }>, res) => {
  const { id } = req.params;

  await postService.deletePost(id);
  res.status(200).json({
    ok: true,
    message: "Post deleted",
  });
});

export const bulkDeletePostsController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  await postService.bulkDeletePosts(ids);

  res.status(200).json({
    ok: true,
    message: "Post deleted",
  });
});
