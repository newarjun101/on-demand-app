import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../validators/review';
import { reviewController } from '../controllers/review.controller';

export const reviewRouter = Router();

reviewRouter.post('/bookings/:bookingId/review', authenticate(), requireRole('CUSTOMER'), validate(createReviewSchema), reviewController.create);

reviewRouter.get('/workers/:workerId', authenticate(), reviewController.listForWorker);