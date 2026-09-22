import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { analyticsService, AnalyticsRange } from '../services/analytics.service';
import { ok } from '../utils/api';
import { z } from 'zod';
import { validate } from '../middleware/validate';

export const analyticsRouter = Router();

const querySchema = z.object({
  range: z.enum(['day', 'week', 'month', 'year', 'all']).default('week'),
});

analyticsRouter.get('/me/analytics', authenticate(), requireRole('WORKER'), validate(querySchema, 'query'), async (req: any, res, next) => {
  try {
    const range = (req.query.range ?? 'week') as AnalyticsRange;
    const data = await analyticsService.forWorker(req.user!.sub, range);
    res.json(ok(data));
  } catch (e) { next(e); }
});