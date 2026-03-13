import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { ok } from "../utils/reponse";

import { postService } from "../services/post.service";

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

  ok(res, response, "Post fetched");
});

export const getTotalPostCountController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await postService.getTotalPostCount(query);

  ok(res, response, "Post count fetched");
});

export const getPostByIdController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const response = await postService.getPostById(id);

  ok(res, response, "Post fetched");
});

export const getPostArchiveCountByMonthController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getPostArchiveCountByMonth();

  ok(res, response, "Post archive count fetched");
});

export const getPostCategoryCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getPostCategoryCount();

  ok(res, response, "Post category count fetched");
});

export const getPostCurrentMonthCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getPostCurrentMonthCount();

  ok(res, response, "Post current month count fetched");
});

export const getFeaturedPostController = asyncHandler(async (req: Request, res: Response) => {
  const response = await postService.getFeaturedPost();

  ok(res, response, "Featured post fetched");
});

export const patchPostController = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const { id } = req.params as { id: string };
  const filesToUpload = req.filesToUpload;

  const response = await postService.patchPost(id, data, filesToUpload);

  ok(res, response, "Post updated");
});

export const setFeaturedPostController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const response = await postService.setFeaturedPost(id);

  ok(res, response, "Post featured updated");
});

export const deletePostController = asyncHandler(async (req: Request<{ id: string }>, res) => {
  const { id } = req.params;

  const response = await postService.deletePost(id);

  ok(res, response, "Post deleted");
});

export const bulkDeletePostsController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  const response = await postService.bulkDeletePosts(ids);

  ok(res, response, "Posts deleted");
});
