// src/services/news/news.service.ts
import { db } from "../config/firebase";
import { TransparencyRepository } from "../repositories/transaprency.repository";
import { uploadFile } from "../storage/upload.file";
import { deleteFile } from "../storage/deleteFile";

import type { AuthedUser } from "../middleware/auth";
import type {
  TransparencySeal,
  TransparencyFolder,
  GetTransparency,
  GetTransparencyCount,
} from "../types/transparency.type";
import type { UploadInput } from "../storage/upload";

import type { WhereFilter } from "../repositories/base.repository";

const transparencyRepo = new TransparencyRepository(db);

export const createTransparency = async (user: AuthedUser, data: TransparencySeal, fileToUpload: UploadInput) => {
  let uploadedFile: {
    name: string;
    url: string;
  } = { name: "", url: "" };

  try {
    if (fileToUpload) {
      const { fileName, url: uploadUrls } = await uploadFile("transparency", fileToUpload);

      uploadedFile = { name: fileName, url: uploadUrls };
    }

    return await transparencyRepo.createTransparency({
      ...data,
      authorId: user.uid,
      file: { name: uploadedFile.name, url: uploadedFile.url },
    });
  } catch (error) {
    if (uploadedFile) {
      await deleteFile(uploadedFile.url);
    }

    throw error;
  }
};

export const createTransparencyFolder = async (user: AuthedUser, data: TransparencyFolder) => {
  return await transparencyRepo.createTransparencyFolder(data);
};

export const patchTransparency = async (id: string, data: Omit<TransparencySeal, "id">, fileToUpload: UploadInput) => {
  let uploadedFile: {
    name: string;
    url: string;
  } | null = null;

  try {
    if (fileToUpload) {
      const { fileName, url: uploadUrls } = await uploadFile("transparency", fileToUpload);

      uploadedFile = { name: fileName, url: uploadUrls };

      data.file = {
        name: uploadedFile.name,
        url: uploadedFile.url,
      };
    }

    return await transparencyRepo.updateTransparency(id, data);
  } catch (error) {
    if (uploadedFile) {
      await deleteFile(uploadedFile.url);
    }

    throw error;
  }
};

export const updateTransparencyFolder = async (id: string, payload: Partial<TransparencyFolder>) => {
  return await transparencyRepo.updateTransparencyFolder(id, payload);
};

export const deleteTransparency = async (id: string) => {
  return await transparencyRepo.deleteTransparency(id);
};

export const bulkDeleteTransparency = async (ids: string[]) => {
  return await transparencyRepo.bulkDeleteTransparency(ids);
};

export const deleteTransparencyFolder = async (id: string) => {
  return await transparencyRepo.deleteTransparencyFolder(id);
};

export const getPaginatedTransparency = async ({ page, pageSize, year, status, title }: GetTransparency) => {
  const filters: WhereFilter[] = [];

  if (year) filters.push({ field: "year", op: "==", value: year });
  if (status) filters.push({ field: "status", op: "==", value: status });
  if (title) filters.push({ field: "title", op: "==", value: title });

  return await transparencyRepo.getPaginated({ page, pageSize, filters });
};

export const getTotalTransparencyCount = async ({ year, title, status }: GetTransparencyCount) => {
  const filters: WhereFilter[] = [];

  if (year) filters.push({ field: "year", op: "==", value: year });
  if (title) filters.push({ field: "title", op: "==", value: title });
  if (status) filters.push({ field: "status", op: "==", value: status });

  return await transparencyRepo.totalCount(filters);
};

export const getTransparencyFolder = async ({ year, title }: { year?: number; title?: string }) => {
  const filters: WhereFilter[] = [];

  if (year) filters.push({ field: "year", op: "==", value: year });
  if (title) filters.push({ field: "title", op: "==", value: title });

  return await transparencyRepo.listTransparencyFolders(filters);
};

export const getTransparencyWithFilters = async ({ year, status }: { year?: number; status?: string }) => {
  const filters: WhereFilter[] = [];

  if (year) filters.push({ field: "year", op: "==", value: year });
  if (status) filters.push({ field: "status", op: "==", value: status });

  return await transparencyRepo.listAllWithFilters(filters);
};
