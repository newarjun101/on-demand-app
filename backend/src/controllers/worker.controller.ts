import { Request, Response, NextFunction } from 'express';
import { workerService } from '../services/worker.service';
import { eventService } from '../services/event.service';
import { favoriteService } from '../services/favorite.service';
import { errors, ok } from '../utils/api';

export const workerController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await workerService.search(req.query as never))); } catch (error) { next(error); }
  },
  async recommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 8);
      const data = await eventService.recommendations(req.user!.sub, page, pageSize, {
        latitude: req.query.latitude != null ? Number(req.query.latitude) : undefined,
        longitude: req.query.longitude != null ? Number(req.query.longitude) : undefined,
      });
      res.json(ok(data));
    } catch (error) { next(error); }
  },
  async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await workerService.getPublicProfile(req.params.id))); } catch (error) { next(error); }
  },
  async getMine(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await workerService.getPublicProfile(req.user!.sub))); } catch (error) { next(error); }
  },
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await workerService.updateOwnProfile(req.user!.sub, req.body))); } catch (error) { next(error); }
  },
  async submitKyc(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(ok(await workerService.submitKyc(req.user!.sub, req.body))); } catch (error) { next(error); }
  },
  async upsertService(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await workerService.upsertService(req.user!.sub, req.body))); } catch (error) { next(error); }
  },
  async removeService(req: Request, res: Response, next: NextFunction) {
    try { await workerService.removeService(req.user!.sub, req.params.serviceId); res.json(ok({})); } catch (error) { next(error); }
  },
  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await workerService.upsertAvailability(req.user!.sub, req.body))); } catch (error) { next(error); }
  },
  async setStatus(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await workerService.setOnline(req.user!.sub, req.body))); } catch (error) { next(error); }
  },
  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw errors.badRequest('Invalid lat/lng');
      res.json(ok(await workerService.updateLiveLocation(req.user!.sub, latitude, longitude)));
    } catch (error) { next(error); }
  },
  async addPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageUrl, caption } = req.body;
      if (!imageUrl) throw errors.badRequest('imageUrl required');
      res.status(201).json(ok(await workerService.addPortfolioImage(req.user!.sub, imageUrl, caption)));
    } catch (error) { next(error); }
  },
  async removePortfolio(req: Request, res: Response, next: NextFunction) {
    try { await workerService.removePortfolioImage(req.user!.sub, req.params.imageId); res.json(ok({})); } catch (error) { next(error); }
  },
  async addFavorite(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await favoriteService.add(req.user!.sub, req.params.id))); } catch (error) { next(error); }
  },
  async removeFavorite(req: Request, res: Response, next: NextFunction) {
    try { await favoriteService.remove(req.user!.sub, req.params.id); res.json(ok({})); } catch (error) { next(error); }
  },
};
