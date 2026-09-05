import { Router } from 'express';
import { notificationService } from '../services/notification.service';
import { authenticate } from '../middleware/auth';
import { ok } from '../utils/api';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate(), async (req: any, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const unreadOnly = String(req.query.unreadOnly ?? '') === 'true';
    const data = await notificationService.listForUser(req.user!.sub, page, pageSize, unreadOnly);
    res.json(ok(data));
  } catch (e) { next(e); }
});

notificationRouter.post('/:id/read', authenticate(), async (req, res, next) => {
  try {
    const data = await notificationService.markRead(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

notificationRouter.post('/read-all', authenticate(), async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user!.sub);
    res.json(ok({}));
  } catch (e) { next(e); }
});