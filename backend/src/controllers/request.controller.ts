import { Request, Response, NextFunction } from 'express';
import { requestService } from '../services/request.service';
import { errors, ok } from '../utils/api';

export const requestController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(ok(await requestService.create(req.user!.sub, req.body))); } catch (error) { next(error); }
  },
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, status } = req.query as unknown as { page: number; pageSize: number; status?: string };
      res.json(ok(await requestService.listForCustomer(req.user!.sub, Number(page), Number(pageSize), status)));
    } catch (error) { next(error); }
  },
  async listFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, status } = req.query as unknown as { page: number; pageSize: number; status?: string };
      res.json(ok(await requestService.listForWorker(req.user!.sub, Number(page), Number(pageSize), status)));
    } catch (error) { next(error); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await requestService.getById(req.params.id);
      const userId = req.user!.sub;
      const role = req.user!.role;
      const isCustomer = role === 'CUSTOMER' && data.customerId === userId;
      const isAdmin = role === 'ADMIN';
      const isWorker = role === 'WORKER';
      const isOpenRequest = data.status === 'FINDING_WORKERS';
      const isQuoter = isWorker && data.quotes.some((quote) => quote.workerId === userId);
      const isBookingWorker = isWorker && data.booking?.workerId === userId;
      if (!isCustomer && !isAdmin && !isOpenRequest && !isQuoter && !isBookingWorker) throw errors.forbidden();
      res.json(ok(data));
    } catch (error) { next(error); }
  },
  async cancel(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await requestService.cancel(req.user!.sub, req.params.id))); } catch (error) { next(error); }
  },
};
