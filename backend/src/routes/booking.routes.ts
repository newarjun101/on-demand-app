import { Router } from 'express';
import { bookingService } from '../services/booking.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateBookingStatusSchema,
  payBookingSchema,
  cancelBookingSchema,
} from '../validators/booking';
import { ok } from '../utils/api';

export const bookingRouter = Router();

bookingRouter.get('/mine', authenticate(), requireRole('CUSTOMER'), async (req: any, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const data = await bookingService.listForCustomer(req.user!.sub, page, pageSize);
    res.json(ok(data));
  } catch (e) { next(e); }
});

bookingRouter.get('/jobs', authenticate(), requireRole('WORKER'), async (req: any, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const data = await bookingService.listForWorker(req.user!.sub, page, pageSize);
    res.json(ok(data));
  } catch (e) { next(e); }
});

bookingRouter.get('/:id', authenticate(), async (req, res, next) => {
  try {
    const data = await bookingService.getById(req.params.id);
    const userId = req.user!.sub;
    if (data.customerId !== userId && data.workerId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }
    res.json(ok(data));
  } catch (e) { next(e); }
});

bookingRouter.patch('/:id/status', authenticate(), requireRole('WORKER'), validate(updateBookingStatusSchema), async (req, res, next) => {
  try {
    const data = await bookingService.updateStatus(req.user!.sub, req.params.id, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

bookingRouter.post('/:id/cancel', authenticate(), requireRole('CUSTOMER'), validate(cancelBookingSchema), async (req, res, next) => {
  try {
    const data = await bookingService.cancel(req.user!.sub, req.params.id, req.body.reason);
    res.json(ok(data));
  } catch (e) { next(e); }
});

bookingRouter.post('/:id/pay', authenticate(), requireRole('CUSTOMER'), validate(payBookingSchema), async (req, res, next) => {
  try {
    const data = await bookingService.pay(req.user!.sub, req.params.id, req.body.method);
    res.json(ok(data));
  } catch (e) { next(e); }
});