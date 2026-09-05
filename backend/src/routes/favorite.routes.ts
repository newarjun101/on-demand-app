import { Router } from 'express';
import { favoriteService } from '../services/favorite.service';
import { authenticate, requireRole } from '../middleware/auth';
import { ok } from '../utils/api';

export const favoriteRouter = Router();

favoriteRouter.get('/', authenticate(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const data = await favoriteService.list(req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});