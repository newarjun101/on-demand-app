import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { favoriteController } from '../controllers/favorite.controller';

export const favoriteRouter = Router();

favoriteRouter.get('/', authenticate(), requireRole('CUSTOMER'), favoriteController.list);