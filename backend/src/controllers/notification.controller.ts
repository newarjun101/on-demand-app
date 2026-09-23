import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { ok } from '../utils/api';

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);
      const unreadOnly = String(req.query.unreadOnly ?? '') === 'true';
      const data = await notificationService.listForUser(req.user!.sub, page, pageSize, unreadOnly);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await notificationService.markRead(req.user!.sub, req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead(req.user!.sub);
      res.json(ok({}));
    } catch (error) {
      next(error);
    }
  },
};
