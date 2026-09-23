import { Request, Response, NextFunction } from 'express';
import { boostService } from '../services/boost.service';
import { ok } from '../utils/api';
import { PurchaseBoostInput } from '../validators/boost';

export const boostController = {
  async getPricing(_req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await boostService.pricing())); } catch (error) { next(error); }
  },

  async purchase(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await boostService.purchaseBoost(
        req.user!.sub,
        req.body as PurchaseBoostInput,
      );
      res.status(201).json(ok(data));
    } catch (error) {
      next(error);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await boostService.myBoosts(req.user!.sub);
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },
};
