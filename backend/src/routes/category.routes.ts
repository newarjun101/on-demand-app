import { Router } from 'express';
import { catalogController } from '../controllers/catalog.controller';

export const categoryRouter = Router();
export const serviceRouter = Router();

categoryRouter.get('/', catalogController.listCategories);

serviceRouter.get('/', catalogController.listServices);

serviceRouter.get('/:slug', catalogController.getService);