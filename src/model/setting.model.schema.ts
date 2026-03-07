import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

export const LogCleanupSettingsSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  scheduleExpression: z.string(),
  retentionDays: z.number(),
  batchSize: z.number(),
  lastRun: z.instanceof(Timestamp).optional(),
  nextRun: z.instanceof(Timestamp).optional(),
  createdAt: z.instanceof(Timestamp).optional(),
  updatedAt: z.instanceof(Timestamp).optional(),
});

export type LogCleanupSettings = z.infer<typeof LogCleanupSettingsSchema>;
