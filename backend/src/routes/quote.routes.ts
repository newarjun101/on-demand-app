import { Router } from 'express';
import { quoteService } from '../services/quote.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuoteSchema } from '../validators/quote';
import { ok } from '../utils/api';

export const quoteRouter = Router();

quoteRouter.post('/requests/:requestId/quotes', authenticate(), requireRole('WORKER'), validate(createQuoteSchema), async (req, res, next) => {
  try {
    const data = await quoteService.create(req.user!.sub, req.params.requestId, req.body);
    res.status(201).json(ok(data));
  } catch (e) { next(e); }
});

quoteRouter.get('/requests/:requestId/quotes', authenticate(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const data = await quoteService.listForRequest(req.params.requestId, req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});

quoteRouter.post('/quotes/:id/withdraw', authenticate(), requireRole('WORKER'), async (req, res, next) => {
  try {
    const data = await quoteService.withdraw(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

quoteRouter.post('/quotes/:id/accept', authenticate(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const data = await quoteService.accept(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

quoteRouter.post('/quotes/:id/reject', authenticate(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const data = await quoteService.reject(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});