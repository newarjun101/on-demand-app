import { Request, Response, NextFunction } from 'express';
import { quoteService } from '../services/quote.service';
import { ok } from '../utils/api';

export const quoteController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await quoteService.create(req.user!.sub, req.params.requestId, req.body);
      res.status(201).json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async listForRequest(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await quoteService.listForRequest(req.params.requestId, req.user!.sub)));
    } catch (error) {
      next(error);
    }
  },

  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await quoteService.withdraw(req.user!.sub, req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await quoteService.accept(req.user!.sub, req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await quoteService.reject(req.user!.sub, req.params.id)));
    } catch (error) {
      next(error);
    }
  },
};
