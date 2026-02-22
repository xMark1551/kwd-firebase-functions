import { z } from "zod";

export const logSettingsSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  scheduleExpression: z.string(), // Cron expression
  retentionDays: z.number().int().min(0),
  batchSize: z.number().int().min(1).optional(),
  lastRun: z.string().optional(),
  nextRun: z.string().optional(),
});

export type LogSettings = z.infer<typeof logSettingsSchema>;

export const patchLogSettingsSchema = logSettingsSchema.partial();
export type PatchLogSettings = z.infer<typeof patchLogSettingsSchema>;
