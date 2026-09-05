import { Router } from 'express';
import { reviewService } from '../services/review.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../validators/review';
import { ok } from '../utils/api';

export const reviewRouter = Router();

reviewRouter.post('/bookings/:bookingId/review', authenticate(), requireRole('CUSTOMER'), validate(createReviewSchema), async (req, res, next) => {
  try {
    const data = await reviewService.create(req.user!.sub, req.params.bookingId, req.body);
    res.status(201).json(ok(data));
  } catch (e) { next(e); }
});

reviewRouter.get('/workers/:workerId', authenticate(), async (req: any, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const data = await reviewService.listForWorker(req.params.workerId, page, pageSize);
    res.json(ok(data));
  } catch (e) { next(e); }
});