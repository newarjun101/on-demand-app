import { z } from 'zod';

export const purchaseBoostSchema = z.object({
  durationDays: z.number().int().min(1).max(30),
  amount: z.number().int().min(1000),
  paymentMethod: z.enum(['CASH_ON_COMPLETION', 'KBZPAY', 'WAVE_MONEY', 'AYA_PAY', 'STRIPE']).optional(),
});

export type PurchaseBoostInput = z.infer<typeof purchaseBoostSchema>;
