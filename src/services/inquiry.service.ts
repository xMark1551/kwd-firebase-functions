import { db } from "../config/firebase";
import { InquiryRepository } from "../repositories/inquiry.repo";
import { uploadFile } from "../storage/upload.file";
import { deleteFile } from "../storage/deleteFile";

import type { CreateInquiry, GetPaginatedInquiry, GetInquiriesCount } from "../types/inquiry.type";
import type { UploadInput } from "../storage/upload";

const inquiryRepo = new InquiryRepository(db);

export const createInquiry = async (data: CreateInquiry, fileToUpload: UploadInput) => {
  let uploadedFile: {
    name: string;
    url: string;
  } | null = null;

  try {
    if (fileToUpload) {
      const { fileName, url: uploadUrls } = await uploadFile("inquiry", fileToUpload);

      uploadedFile = { name: fileName, url: uploadUrls };

      data.file = {
        name: uploadedFile.name,
        url: uploadedFile.url,
      };
    }

    return await inquiryRepo.createInquiry(data);
  } catch (error) {
    if (uploadedFile) {
      await deleteFile(uploadedFile.url);
    }

    throw error;
  }
};

export const toggleReadStatus = async (id: string): Promise<void> => {
  return inquiryRepo.toggleReadStatus(id);
};

export const markAllAsRead = async (ids: string[]): Promise<void> => {
  return inquiryRepo.markAllAsRead(ids);
};

export const deleteInquiry = async (id: string): Promise<void> => {
  return inquiryRepo.deleteInquiry(id);
};

export const bulkDeleteInquiries = async (ids: string[]): Promise<void> => {
  return inquiryRepo.bulkDeleteInquiries(ids);
};

export const getPaginatedInquiry = async ({ page, pageSize, category, status }: GetPaginatedInquiry) => {
  const filters: any[] = [];

  if (category && category !== "latest") filters.push({ field: "category", op: "==", value: category });
  if (status) filters.push({ field: "status", op: "==", value: status });

  return await inquiryRepo.getPaginated({
    page,
    pageSize,
    filters,
  });
};

export const getInquiriesTotalCount = async (payload: GetInquiriesCount) => {
  const { category, status } = payload;
  const filters: any[] = [];

  if (category && category !== "latest") filters.push({ field: "category", op: "==", value: category });
  if (status) filters.push({ field: "status", op: "==", value: status });

  return await inquiryRepo.totalCount(filters);
};

export const getCurrentMonthInquiriesCount = async () => {
  return await inquiryRepo.CurrentMonthInquiryCount();
};

export const getUnreadInquiriesCount = async () => {
  return await inquiryRepo.UnreadInquiryCount();
};
