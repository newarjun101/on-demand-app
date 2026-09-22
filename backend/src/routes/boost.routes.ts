import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { boostService } from '../services/boost.service';
import { ok } from '../utils/api';
import { z } from 'zod';
import { validate } from '../middleware/validate';

export const boostRouter = Router();

const purchaseSchema = z.object({
  durationDays: z.number().int().min(1).max(30),
  amount: z.number().int().min(1000),
  paymentMethod: z.enum(['CASH_ON_COMPLETION', 'KBZPAY', 'WAVE_MONEY', 'AYA_PAY', 'STRIPE']).optional(),
});

boostRouter.get('/pricing', (_req, res) => {
  res.json(ok(boostService.pricing()));
});

boostRouter.post('/me/boost', authenticate(), requireRole('WORKER'), validate(purchaseSchema), async (req, res, next) => {
  try {
    const data = await boostService.purchaseBoost(req.user!.sub, req.body);
    res.status(201).json(ok(data));
  } catch (e) { next(e); }
});

boostRouter.get('/me/boosts', authenticate(), requireRole('WORKER'), async (req, res, next) => {
  try {
    const data = await boostService.myBoosts(req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});