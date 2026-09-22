import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { purchaseBoostSchema } from '../validators/boost';
import { boostController } from '../controllers/boost.controller';

export const boostRouter = Router();

boostRouter.get('/pricing', boostController.getPricing);

boostRouter.post(
  '/me/boost',
  authenticate(),
  requireRole('WORKER'),
  validate(purchaseBoostSchema),
  boostController.purchase,
);

boostRouter.get(
  '/me/boosts',
  authenticate(),
  requireRole('WORKER'),
  boostController.listMine,
);