import { z } from 'zod';

export const createRequestSchema = z.object({
  serviceId: z.string().uuid(),
  description: z.string().min(10).max(2000),
  city: z.string().min(1).max(80),
  addressLine: z.string().min(1).max(200),
  landmark: z.string().max(200).optional(),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  schedule: z.enum(['AS_SOON_AS_POSSIBLE', 'TODAY', 'TOMORROW', 'CUSTOM_DATE']),
  scheduledAt: z.string().datetime().optional(),
  minBudget: z.number().int().min(0).optional(),
  maxBudget: z.number().int().min(0).optional(),
  photoUrls: z.array(z.string()).max(20).optional(),
});

export const listRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;