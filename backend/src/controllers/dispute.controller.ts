import { Request, Response, NextFunction } from 'express';
import { disputeService } from '../services/dispute.service';
import { errors, ok } from '../utils/api';

export const disputeController = {
  async open(req: Request, res: Response, next: NextFunction) {
    try {
      const reason = req.body.reason ?? 'OTHER';
      const description = String(req.body.description ?? '');
      if (!description) throw errors.badRequest('description is required');
      const data = await disputeService.open(req.user!.sub, req.params.bookingId, reason, description);
      res.status(201).json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await disputeService.listMine(req.user!.sub)));
    } catch (error) {
      next(error);
    }
  },
};
