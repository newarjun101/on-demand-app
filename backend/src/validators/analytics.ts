import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  range: z.enum(['day', 'week', 'month', 'year', 'all']).default('week'),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
