import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { analyticsQuerySchema } from '../validators/analytics';
import { analyticsController } from '../controllers/analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.get(
  '/me/analytics',
  authenticate(),
  requireRole('WORKER'),
  validate(analyticsQuerySchema, 'query'),
  analyticsController.getWorkerAnalytics,
);