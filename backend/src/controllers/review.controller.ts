import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import { ok } from '../utils/api';

export const reviewController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reviewService.create(req.user!.sub, req.params.bookingId, req.body);
      res.status(201).json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async listForWorker(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);
      const data = await reviewService.listForWorker(req.params.workerId, page, pageSize);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },
};
