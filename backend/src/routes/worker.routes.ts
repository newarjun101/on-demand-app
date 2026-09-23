import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  workerSearchSchema,
  updateWorkerProfileSchema,
  upsertServiceSchema,
  upsertAvailabilitySchema,
  setOnlineSchema,
  submitKycSchema,
} from '../validators/worker';
import { requireRole } from '../middleware/auth';
import { workerController } from '../controllers/worker.controller';

export const workerRouter = Router();

// Public worker search (used by customer app)
workerRouter.get('/', validate(workerSearchSchema, 'query'), workerController.search);

// Personalised "Recommended for you" feed (customer-only).
workerRouter.get('/recommendations', authenticate(), requireRole('CUSTOMER'), workerController.recommendations);

workerRouter.get('/:id', workerController.getPublicProfile);

// Worker-only routes
workerRouter.get('/me/profile', authenticate(), requireRole('WORKER'), workerController.getMine);

workerRouter.patch('/me/profile', authenticate(), requireRole('WORKER'), validate(updateWorkerProfileSchema), workerController.updateProfile);
workerRouter.post('/me/kyc', authenticate(), requireRole('WORKER'), validate(submitKycSchema), workerController.submitKyc);

workerRouter.post('/me/services', authenticate(), requireRole('WORKER'), validate(upsertServiceSchema), workerController.upsertService);

workerRouter.delete('/me/services/:serviceId', authenticate(), requireRole('WORKER'), workerController.removeService);

workerRouter.put('/me/availability', authenticate(), requireRole('WORKER'), validate(upsertAvailabilitySchema), workerController.updateAvailability);

workerRouter.post('/me/status', authenticate(), requireRole('WORKER'), validate(setOnlineSchema), workerController.setStatus);

workerRouter.post('/me/location', authenticate(), requireRole('WORKER'), workerController.updateLocation);

// Portfolio
workerRouter.post('/me/portfolio', authenticate(), requireRole('WORKER'), workerController.addPortfolio);

workerRouter.delete('/me/portfolio/:imageId', authenticate(), requireRole('WORKER'), workerController.removePortfolio);

// Favorites
workerRouter.post('/:id/favorite', authenticate(), requireRole('CUSTOMER'), workerController.addFavorite);

workerRouter.delete('/:id/favorite', authenticate(), requireRole('CUSTOMER'), workerController.removeFavorite);