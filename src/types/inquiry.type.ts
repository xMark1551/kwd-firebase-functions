import { Timestamp } from "firebase-admin/firestore";

interface FileData {
  name: string;
  url: string;
}

export type Inquiry = {
  id: string;
  reason: string;
  name: string;
  email: string;
  message: string;
  file: FileData | null;
  isRead: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export interface CreateInquiry extends Omit<Inquiry, "file" | "isread"> {
  file: FileData | null;
}

export interface GetPaginatedInquiry {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
}

export interface GetInquiriesCount {
  category?: string;
  status?: string;
}
