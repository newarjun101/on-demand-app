import { Router } from 'express';
import { requestService } from '../services/request.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRequestSchema, listRequestsQuerySchema } from '../validators/request';
import { ok } from '../utils/api';

export const requestRouter = Router();

// Customer creates request
requestRouter.post('/', authenticate(), requireRole('CUSTOMER'), validate(createRequestSchema), async (req, res, next) => {
  try {
    const data = await requestService.create(req.user!.sub, req.body);
    res.status(201).json(ok(data));
  } catch (e) { next(e); }
});

requestRouter.get('/mine', authenticate(), requireRole('CUSTOMER'), validate(listRequestsQuerySchema, 'query'), async (req: any, res, next) => {
  try {
    const { page, pageSize, status } = req.query;
    const data = await requestService.listForCustomer(req.user!.sub, Number(page), Number(pageSize), status as string | undefined);
    res.json(ok(data));
  } catch (e) { next(e); }
});

requestRouter.get('/feed', authenticate(), requireRole('WORKER'), validate(listRequestsQuerySchema, 'query'), async (req: any, res, next) => {
  try {
    const { page, pageSize, status } = req.query;
    const data = await requestService.listForWorker(req.user!.sub, Number(page), Number(pageSize), status as string | undefined);
    res.json(ok(data));
  } catch (e) { next(e); }
});

requestRouter.get('/:id', authenticate(), async (req, res, next) => {
  try {
    const data = await requestService.getById(req.params.id);
    // Authorization rules:
    //  - The customer who created the request can always view it.
    //  - Admins can always view it.
    //  - Any worker can view an OPEN request (status=FINDING_WORKERS) so they can decide whether to quote.
    //  - A worker who has already quoted on this request can view it (to track their own quote).
    //  - The worker who eventually wins the booking can view it after the quote is accepted.
    const userId = req.user!.sub;
    const role = req.user!.role;
    const isCustomer = role === 'CUSTOMER' && data.customerId === userId;
    const isAdmin = role === 'ADMIN';
    const isWorker = role === 'WORKER';
    const isOpenRequest = data.status === 'FINDING_WORKERS';
    const isQuoter = isWorker && data.quotes.some((q) => q.workerId === userId);
    const isBookingWorker = isWorker && data.booking?.workerId === userId;

    if (!isCustomer && !isAdmin && !isOpenRequest && !isQuoter && !isBookingWorker) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }
    res.json(ok(data));
  } catch (e) { next(e); }
});

requestRouter.post('/:id/cancel', authenticate(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const data = await requestService.cancel(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});