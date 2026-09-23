import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { ok } from '../utils/api';
import { AnalyticsQuery } from '../validators/analytics';

export const analyticsController = {
  async getWorkerAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { range } = req.query as unknown as AnalyticsQuery;
      const data = await analyticsService.forWorker(req.user!.sub, range);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },
};
