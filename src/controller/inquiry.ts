import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/handler";

import { inquiryService } from "../services/inquiry.service";

export const createInquiryController = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const fileToUpload = req.filesToUpload[0];

  await inquiryService.createInquiry(data, fileToUpload);

  res.status(200).json({
    ok: true,
    message: "Inquiry created",
  });
});

export const getPaginatedInquiryController = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery;

  const response = await inquiryService.getPaginatedInquiriesWithTotalCount(query);

  res.status(200).json({
    ok: true,
    items: response.items,
    meta: response.meta,
    nextCursor: response.nextCursor,
  });
});

export const getInquiriesTotalCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await inquiryService.getInquiriesTotalCount();

  res.status(200).json({ count: response });
});

export const getCurrentMonthInquiriesCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await inquiryService.getCurrentMonthInquiriesCount();

  res.status(200).json(response);
});

export const getUnreadInquiriesCountController = asyncHandler(async (req: Request, res: Response) => {
  const response = await inquiryService.getUnreadInquiriesCount();

  res.status(200).json(response);
});

export const toggleReadStatusController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  await inquiryService.toggleReadStatus(id);

  res.status(200).json({
    ok: true,
  });
});

export const markAllAsReadController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  await inquiryService.markAllAsRead(ids);

  res.status(200).json({
    ok: true,
  });
});

export const deleteInquiryController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  await inquiryService.deleteInquiry(id);

  res.status(200).json({
    ok: true,
  });
});

export const bulkDeleteInquiriesController = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body;

  await inquiryService.bulkDeleteInquiries(ids);

  res.status(200).json({
    ok: true,
  });
});
