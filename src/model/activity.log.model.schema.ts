import { z } from "zod";

export const activityLogSchema = z.object({
  id: z.string(),
  level: z.string(),
  action: z.string(),
  message: z.string(),
  createdAt: z.string(),
  user: z.string(),
});

export type ActivityLog = z.infer<typeof activityLogSchema>;
