import { z } from 'zod';

export const updateBookingStatusSchema = z.object({
  status: z.enum(['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  latitude: z.number().gte(-90).lte(90).optional(),
  longitude: z.number().gte(-180).lte(180).optional(),
});

export const payBookingSchema = z.object({
  method: z.enum(['CASH_ON_COMPLETION', 'KBZPAY', 'WAVE_MONEY', 'AYA_PAY', 'STRIPE']).default('CASH_ON_COMPLETION'),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;