import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { eventService } from '../services/event.service';
import { ok } from '../utils/api';
import { z } from 'zod';
import { validate } from '../middleware/validate';

export const eventRouter = Router();

const eventSchema = z.object({
  type: z.enum(['search', 'view_service', 'view_worker', 'view_category', 'click', 'favorite', 'book', 'chat']),
  serviceSlug: z.string().optional(),
  categorySlug: z.string().optional(),
  workerId: z.string().uuid().optional(),
  city: z.string().optional(),
  query: z.string().max(200).optional(),
  source: z.enum(['organic', 'boost', 'search', 'category', 'home', 'profile', 'direct', 'favorites', 'requests', 'recommendations']).optional(),
  weight: z.number().int().min(1).max(10).optional(),
});

// Log a single event (fire-and-forget from the client side).
eventRouter.post('/', authenticate(), validate(eventSchema), async (req, res, next) => {
  try {
    const data = await eventService.log(req.user!.sub, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// Log a batch of events (e.g. when navigating between pages).
const batchSchema = z.object({
  events: z.array(eventSchema).max(20),
});
eventRouter.post('/batch', authenticate(), validate(batchSchema), async (req, res, next) => {
  try {
    const results = await Promise.all(req.body.events.map((e: any) => eventService.log(req.user!.sub, e)));
    res.json(ok({ count: results.length }));
  } catch (e) { next(e); }
});