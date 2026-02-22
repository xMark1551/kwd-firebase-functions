import { Timestamp } from "firebase-admin/firestore";

interface FileData {
  name: string;
  url: string;
}

export type TransparencySeal = {
  authorId: string;
  id: string;
  title: string;
  folder: string;
  folderId: string | null;
  year: number;
  file: FileData;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export interface CreateTransparency extends Omit<TransparencySeal, "id"> {
  folderId: string;
}

export type TransparencyFolder = {
  id: string;
  name: string;
  title: string;
  year: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export interface GetTransparency {
  page?: number;
  pageSize?: number;
  year?: number;
  status?: string;
  title?: string;
}

export interface GetTransparencyCount {
  year?: number;
  title?: string;
  status?: string;
}
