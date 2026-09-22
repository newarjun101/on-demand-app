import { Router } from 'express';
import { workerService } from '../services/worker.service';
import { eventService } from '../services/event.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  workerSearchSchema,
  updateWorkerProfileSchema,
  upsertServiceSchema,
  upsertAvailabilitySchema,
  setOnlineSchema,
} from '../validators/worker';
import { requireRole } from '../middleware/auth';
import { ok } from '../utils/api';
import { favoriteService } from '../services/favorite.service';

export const workerRouter = Router();

// Public worker search (used by customer app)
workerRouter.get('/', validate(workerSearchSchema, 'query'), async (req: any, res, next) => {
  try {
    const data = await workerService.search(req.query);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// Personalised "Recommended for you" feed (customer-only).
workerRouter.get('/recommendations', authenticate(), requireRole('CUSTOMER'), async (req: any, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 8);
    const data = await eventService.recommendations(req.user!.sub, page, pageSize, {
      latitude: req.query.latitude != null ? Number(req.query.latitude) : undefined,
      longitude: req.query.longitude != null ? Number(req.query.longitude) : undefined,
    });
    res.json(ok(data));
  } catch (e) { next(e); }
});

workerRouter.get('/:id', async (req, res, next) => {
  try {
    const data = await workerService.getPublicProfile(req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// Worker-only routes
workerRouter.get('/me/profile', authenticate(), requireRole('WORKER'), async (req, res, next) => {
  try {
    const profile = await workerService.getPublicProfile(req.user!.sub);
    res.json(ok(profile));
  } catch (e) { next(e); }
});

workerRouter.patch('/me/profile', authenticate(), requireRole('WORKER'), validate(updateWorkerProfileSchema), async (req, res, next) => {
  try {
    const data = await workerService.updateOwnProfile(req.user!.sub, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

workerRouter.post('/me/services', authenticate(), requireRole('WORKER'), validate(upsertServiceSchema), async (req, res, next) => {
  try {
    const data = await workerService.upsertService(req.user!.sub, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

workerRouter.delete('/me/services/:serviceId', authenticate(), requireRole('WORKER'), async (req, res, next) => {
  try {
    await workerService.removeService(req.user!.sub, req.params.serviceId);
    res.json(ok({}));
  } catch (e) { next(e); }
});

workerRouter.put('/me/availability', authenticate(), requireRole('WORKER'), validate(upsertAvailabilitySchema), async (req, res, next) => {
  try {
    const data = await workerService.upsertAvailability(req.user!.sub, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

workerRouter.post('/me/status', authenticate(), requireRole('WORKER'), validate(setOnlineSchema), async (req, res, next) => {
  try {
    const data = await workerService.setOnline(req.user!.sub, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

workerRouter.post('/me/location', authenticate(), requireRole('WORKER'), async (req, res, next) => {
  try {
    const lat = Number(req.body.latitude);
    const lng = Number(req.body.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid lat/lng' } });
    }
    const data = await workerService.updateLiveLocation(req.user!.sub, lat, lng);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// Portfolio
workerRouter.post('/me/portfolio', authenticate(), requireRole('WORKER'), async (req, res, next) => {
  try {
    const { imageUrl, caption } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'imageUrl required' } });
    const data = await workerService.addPortfolioImage(req.user!.sub, imageUrl, caption);
    res.status(201).json(ok(data));
  } catch (e) { next(e); }
});

workerRouter.delete('/me/portfolio/:imageId', authenticate(), requireRole('WORKER'), async (req, res, next) => {
  try {
    await workerService.removePortfolioImage(req.user!.sub, req.params.imageId);
    res.json(ok({}));
  } catch (e) { next(e); }
});

// Favorites
workerRouter.post('/:id/favorite', authenticate(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const data = await favoriteService.add(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

workerRouter.delete('/:id/favorite', authenticate(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    await favoriteService.remove(req.user!.sub, req.params.id);
    res.json(ok({}));
  } catch (e) { next(e); }
});