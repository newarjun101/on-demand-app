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
    // Authorization: must be customer or one of the quoting workers
    const userId = req.user!.sub;
    const isCustomer = data.customerId === userId;
    const isWorker = req.user!.role === 'WORKER';
    const isQuoter = isWorker && data.quotes.some((q) => q.workerId === userId);
    const isBookingWorker = isWorker && data.booking?.workerId === userId;
    if (!isCustomer && !isQuoter && !isBookingWorker) {
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