import { z } from "zod";
import { paginationSchema } from "./pagination.schema";

export const metaSchema = z.object({
  user: z
    .object({
      uid: z.string(),
      username: z.string(),
      admin: z.boolean(),
    })
    .nullable(),
  method: z.string(),
  path: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.any().optional(),
  data: z.any().optional(),
  details: z.any().optional(),
});
export type Meta = z.infer<typeof metaSchema>;

export const createActivityLogSchema = z.object({
  level: z.string(),
  status: z.number().optional(),
  action: z.string(),
  message: z.string().optional(),
  meta: metaSchema.optional(),
});

export const activityLogFilterSchema = z.object({
  level: z.enum(["ALL", "ERROR", "WARN", "INFO", "DEBUG"]).optional(),
});
export const getPaginatedActivityLogsSchema = z.object({
  ...paginationSchema.shape,
  filters: activityLogFilterSchema.optional(),
});

export type CreateActivityLog = z.infer<typeof createActivityLogSchema>;
export type ActivityLogFilter = z.infer<typeof activityLogFilterSchema>;
export type GetPaginatedActivityLogs = z.infer<typeof getPaginatedActivityLogsSchema>;
