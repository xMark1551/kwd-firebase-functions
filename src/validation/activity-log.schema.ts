import { z } from "zod";
import { paginationSchema } from "./pagination.schema";

export const authorSchema = z.object({
  uid: z.string(),
  admin: z.boolean(),
  email: z.string(),
});

export const targetSchema = z.object({
  snapshot: z.any().optional(),
});

export const createActivityLogSchema = z.object({
  severity: z.string(),
  author: authorSchema.nullable(),
  action: z.string(),
  target: targetSchema,
  status: z.string(),
  code: z.number(),
  reason: z.string().optional(),
  ip: z.string().optional(),
});

export const activityLogFilterSchema = z.object({
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export const getPaginatedActivityLogsSchema = z.object({
  ...paginationSchema.shape,
  filters: activityLogFilterSchema.optional(),
});

export const activityLogSchema = z.object({
  id: z.string(),
  severity: z.string(),
  author: authorSchema.nullable(),
  action: z.string(),
  target: targetSchema,
  status: z.string(),
  code: z.number(),
  reason: z.string().optional(),
  ip: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Author = z.infer<typeof authorSchema>;
export type Target = z.infer<typeof targetSchema>;
export type CreateActivityLog = z.infer<typeof createActivityLogSchema>;
export type ActivityLogFilter = z.infer<typeof activityLogFilterSchema>;
export type GetPaginatedActivityLogs = z.infer<typeof getPaginatedActivityLogsSchema>;
export type ActivityLog = z.infer<typeof activityLogSchema>;
