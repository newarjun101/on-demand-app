import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { errors, ok } from '../utils/api';

export const catalogController = {
  async listCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(ok(await categoryService.listCategories()));
    } catch (error) {
      next(error);
    }
  },

  async listServices(req: Request, res: Response, next: NextFunction) {
    try {
      const categorySlug = req.query.category as string | undefined;
      res.json(ok(await categoryService.listServices(categorySlug)));
    } catch (error) {
      next(error);
    }
  },

  async getService(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getServiceBySlug(req.params.slug);
      if (!data) throw errors.notFound('Service not found');
      res.json(ok(data));
    } catch (error) {
      next(error);
    }
  },
};
