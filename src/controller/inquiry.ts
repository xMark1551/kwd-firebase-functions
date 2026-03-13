import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { ok } from "../utils/reponse";

import { inquiryService } from "../services/inquiry.service";

export const createInquiryController = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  const response = await inquiryService.createInquiry(data, fileToUpload);

  ok(res, response, "Inquiry created");
});

export const getPaginatedInquiryController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await inquiryService.getPaginatedInquiriesWithTotalCount(query);

  ok(res, response, "Inquiries fetched");
});

export const getInquiriesTotalCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await inquiryService.getInquiriesTotalCount();

  ok(res, response, "Inquiries total count fetched");
});

export const getCurrentMonthInquiriesCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await inquiryService.getCurrentMonthInquiriesCount();

  ok(res, response, "Inquiries current month count fetched");
});

export const getUnreadInquiriesCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await inquiryService.getUnreadInquiriesCount();

  ok(res, response, "Inquiries unread count fetched");
});

export const toggleReadStatusController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const response = await inquiryService.toggleReadStatus(id);

  ok(res, response, "Inquiry read status updated");
});

export const markAllAsReadController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  const response = await inquiryService.markAllAsRead(ids);

  ok(res, response, "Inquiries marked as read");
});

export const deleteInquiryController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const response = await inquiryService.deleteInquiry(id);

  ok(res, response, "Inquiry deleted");
});

export const bulkDeleteInquiriesController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  const response = await inquiryService.bulkDeleteInquiries(ids);

  ok(res, response, "Inquiries bulk deleted");
});
