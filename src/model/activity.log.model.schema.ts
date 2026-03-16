import { z } from "zod";

import { authorSchema, targetSchema } from "../validation/activity-log.schema";

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

export type ActivityLog = z.infer<typeof activityLogSchema>;
