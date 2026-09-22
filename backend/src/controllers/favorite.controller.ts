import { Request, Response, NextFunction } from 'express';
import { favoriteService } from '../services/favorite.service';
import { ok } from '../utils/api';

export const favoriteController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await favoriteService.list(req.user!.sub)));
    } catch (error) {
      next(error);
    }
  },
};
