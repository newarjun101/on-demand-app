import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { errors, ok } from '../utils/api';
import { UpdateBookingStatusInput } from '../validators/booking';

export const bookingController = {
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
      const data = await bookingService.listForCustomer(req.user!.sub, page, pageSize);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
      const data = await bookingService.listForWorker(req.user!.sub, page, pageSize);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await bookingService.getById(req.params.id);
      const userId = req.user!.sub;
      if (data.customerId !== userId && data.workerId !== userId && req.user!.role !== 'ADMIN') {
        throw errors.forbidden();
      }
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await bookingService.updateStatus(
        req.user!.sub,
        req.params.id,
        req.body as UpdateBookingStatusInput,
      );
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await bookingService.cancel(req.user!.sub, req.params.id, req.body.reason);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async pay(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await bookingService.pay(req.user!.sub, req.params.id, req.body.method);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },
};
