import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateBookingStatusSchema,
  payBookingSchema,
  cancelBookingSchema,
  bookingListQuerySchema,
  bookingIdParamsSchema,
} from '../validators/booking';
import { bookingController } from '../controllers/booking.controller';

export const bookingRouter = Router();

bookingRouter.get('/mine', authenticate(), requireRole('CUSTOMER'), validate(bookingListQuerySchema, 'query'), bookingController.listMine);

bookingRouter.get('/jobs', authenticate(), requireRole('WORKER'), validate(bookingListQuerySchema, 'query'), bookingController.listJobs);

bookingRouter.get('/:id', authenticate(), validate(bookingIdParamsSchema, 'params'), bookingController.getById);

bookingRouter.patch('/:id/status', authenticate(), requireRole('WORKER'), validate(bookingIdParamsSchema, 'params'), validate(updateBookingStatusSchema), bookingController.updateStatus);

bookingRouter.post('/:id/cancel', authenticate(), requireRole('CUSTOMER'), validate(bookingIdParamsSchema, 'params'), validate(cancelBookingSchema), bookingController.cancel);

bookingRouter.post('/:id/pay', authenticate(), requireRole('CUSTOMER'), validate(bookingIdParamsSchema, 'params'), validate(payBookingSchema), bookingController.pay);