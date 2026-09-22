import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { ok } from '../utils/api';

export const userController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await userService.me(req.user!.sub)));
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await userService.updateProfile(req.user!.sub, req.body)));
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.changePassword(req.user!.sub, req.body);
      res.json(ok({}));
    } catch (error) {
      next(error);
    }
  },
};
