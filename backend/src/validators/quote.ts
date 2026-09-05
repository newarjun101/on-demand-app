import { z } from 'zod';

export const createQuoteSchema = z.object({
  laborAmount: z.number().int().min(0),
  materialsAmount: z.number().int().min(0),
  additionalFee: z.number().int().min(0).default(0),
  estimatedMinutes: z.number().int().min(5).max(24 * 60).optional(),
  message: z.string().max(1000).optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;