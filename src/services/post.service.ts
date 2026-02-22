// src/services/news/news.service.ts
import { db } from "../config/firebase";
import { NewsRepository } from "../repositories/post.repository";
import { uploadFiles } from "../storage/upload.files";
import { deleteFile } from "../storage/deleteFile";

import type { AuthedUser } from "../middleware/auth";
import type { GetCountArgs, Post } from "../types/post.types";
import type { UploadInput } from "../storage/upload";
import { getDateRangeForYearOrMonth } from "../utils/date.converter";

import type { CreatePost, GetPaginatedPostQuery } from "../validation/post.schema";

import { NEWS_AND_UPDATES_FOLDER } from "../const/collection.name";

import { cacheService } from "../utils/cache";

// helper
import { withFilesRollback } from "../utils/withRollback";

const postRepo = new NewsRepository(db);

export const createPost = async (user: AuthedUser, data: CreatePost, filesToUpload: UploadInput[]) => {
  const files = filesToUpload?.length ? await uploadFiles(NEWS_AND_UPDATES_FOLDER, filesToUpload) : [];
  const post = await withFilesRollback(files, () =>
    postRepo.createWithCounters({ ...data, authorId: user.uid, files }),
  );

  await cacheService.invalidatePattern("post:list:*");

  return post;
};

export const createPost1 = async (user: AuthedUser, data: CreatePost, filesToUpload: UploadInput[]) => {
  const files = filesToUpload?.length ? await uploadFiles(NEWS_AND_UPDATES_FOLDER, filesToUpload) : [];

  try {
    const post = await postRepo.createWithCounters({ ...data, authorId: user.uid, files });

    await cacheService.invalidatePattern("post:list:*");
    return post;
  } catch (error) {
    if (files.length) await deleteFile(files);
    throw error;
  }
};

// export const updatePost = async (id: string, data: UpdatePost, filesToUpload: UploadInput[]) => {
//   let uploadUrls: string[] = [];

//   try {
//     if (filesToUpload && filesToUpload.length) {
//       uploadUrls = await uploadFiles(NEWS_AND_UPDATES_FOLDER, filesToUpload);
//     }

//     // combine updated existing url with new urls
//     if (uploadUrls.length) {
//       data.files = [...data.files, ...uploadUrls];
//     }

//     return await postRepo.updateWithCounters(id, data);
//   } catch (error) {
//     if (uploadUrls.length) {
//       deleteFile(uploadUrls);
//     }

//     throw error;
//   }
// };

export const patchPost = async (id: string, data: Post, filesToUpload: UploadInput[]) => {
  const files = filesToUpload?.length ? await uploadFiles(NEWS_AND_UPDATES_FOLDER, filesToUpload) : [];
  const post = await withFilesRollback(files, () => postRepo.patchWithCounters(id, data));

  await cacheService.invalidatePattern("post:list:*");

  return post;
};

export const deletePost = async (id: string) => {
  await postRepo.deletePostWithCounters(id);
};

export const bulkDeletePosts = async (ids: string[]) => {
  return await postRepo.deleteBulkWithCounters(ids);
};

export const getNewsById = async (id: string) => {
  return await postRepo.getById(id);
};

export const getPaginatedPost = async (query: GetPaginatedPostQuery) => {
  const { page, pageSize, category, status, year, month } = query;

  const cacheKey = `post:list:${page}:${pageSize}:${category}:${status}:${year}:${month}`;

  // 1. Check cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log("HIT - from Redis ⚡", cached);
    return cached;
  }

  const filters: any[] = [];

  if (category && category !== "latest") filters.push({ field: "category", op: "==", value: category });
  if (status) filters.push({ field: "status", op: "==", value: status });
  if (year) {
    // convert year and month to firestore time
    const { start, end } = getDateRangeForYearOrMonth(year, month);

    filters.push({ field: "createdAt", op: ">=", value: start });
    filters.push({ field: "createdAt", op: "<=", value: end });
  }

  const result = await postRepo.getPaginated({
    page,
    pageSize,
    filters,
  });

  // 3. Save to cache
  await cacheService.set(cacheKey, result);

  return result;
};

export const getTotalPostCount = async (payload: GetCountArgs) => {
  const { category, status, year, month } = payload;
  const filters: any[] = [];

  if (category && category !== "latest") filters.push({ field: "category", op: "==", value: category });
  if (status) filters.push({ field: "status", op: "==", value: status });

  if (year) {
    // convert year and month to firestore time
    const { start, end } = getDateRangeForYearOrMonth(year, month);

    filters.push({ field: "createdAt", op: ">=", value: start });
    filters.push({ field: "createdAt", op: "<=", value: end });
  }

  return await postRepo.totalCount();
};

export const getPostById = async (id: string) => {
  return await postRepo.getById(id);
};

export const getPostArchiveCountByMonth = async () => {
  return await postRepo.archivePostList();
};

export const getPostCategoryCount = async () => {
  return await postRepo.categoryList();
};

export const getPostCurrentMonthCount = async () => {
  return await postRepo.currentMonthPostCount();
};

export const getFeaturedPost = async () => {
  return await postRepo.featuredPostList();
};

export const setFeaturedPost = async (id: string) => {
  return await postRepo.updateFeaturedPost(id);
};
