import { Router } from 'express';
import { categoryService } from '../services/category.service';
import { ok } from '../utils/api';

export const categoryRouter = Router();
export const serviceRouter = Router();

categoryRouter.get('/', async (_req, res, next) => {
  try {
    res.json(ok(await categoryService.listCategories()));
  } catch (e) { next(e); }
});

serviceRouter.get('/', async (req: any, res, next) => {
  try {
    const categorySlug = req.query.category as string | undefined;
    res.json(ok(await categoryService.listServices(categorySlug)));
  } catch (e) { next(e); }
});

serviceRouter.get('/:slug', async (req, res, next) => {
  try {
    const data = await categoryService.getServiceBySlug(req.params.slug);
    if (!data) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    res.json(ok(data));
  } catch (e) { next(e); }
});