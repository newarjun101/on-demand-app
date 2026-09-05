import { Router } from 'express';
import { disputeService } from '../services/dispute.service';
import { authenticate } from '../middleware/auth';
import { ok } from '../utils/api';

export const disputeRouter = Router();

disputeRouter.post('/bookings/:bookingId', authenticate(), async (req: any, res, next) => {
  try {
    const reason = req.body.reason ?? 'OTHER';
    const description = String(req.body.description ?? '');
    if (!description) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'description is required' } });
    const data = await disputeService.open(req.user!.sub, req.params.bookingId, reason, description);
    res.status(201).json(ok(data));
  } catch (e) { next(e); }
});

disputeRouter.get('/mine', authenticate(), async (req, res, next) => {
  try {
    const data = await disputeService.listMine(req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});