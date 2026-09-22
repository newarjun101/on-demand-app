import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { ok } from '../utils/api';

export const eventController = {
  async log(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await eventService.log(req.user!.sub, req.body))); } catch (error) { next(error); }
  },
  async logBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await Promise.all(req.body.events.map((event: unknown) => eventService.log(req.user!.sub, event as never)));
      res.json(ok({ count: results.length }));
    } catch (error) { next(error); }
  },
};
