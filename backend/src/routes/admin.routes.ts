import { Router } from 'express';
import { adminService } from '../services/admin.service';
import { authenticate, requireRole } from '../middleware/auth';
import { ok } from '../utils/api';

export const adminRouter = Router();

adminRouter.use(authenticate(), requireRole('ADMIN'));

adminRouter.get('/analytics', async (_req, res, next) => {
  try {
    res.json(ok(await adminService.analytics()));
  } catch (e) { next(e); }
});

// Workers
adminRouter.get('/workers', async (req: any, res, next) => {
  try {
    const status = req.query.status as any;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const data = await adminService.listWorkers({ status, page, pageSize });
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.post('/workers/:userId/approve', async (req, res, next) => {
  try {
    res.json(ok(await adminService.approveWorker(req.params.userId)));
  } catch (e) { next(e); }
});

adminRouter.post('/workers/:userId/reject', async (req: any, res, next) => {
  try {
    const reason = String(req.body?.reason ?? '');
    res.json(ok(await adminService.rejectWorker(req.params.userId, reason)));
  } catch (e) { next(e); }
});

adminRouter.post('/workers/:userId/suspend', async (req, res, next) => {
  try {
    res.json(ok(await adminService.suspendWorker(req.params.userId)));
  } catch (e) { next(e); }
});

// Customers
adminRouter.get('/customers', async (req: any, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    res.json(ok(await adminService.listCustomers(page, pageSize)));
  } catch (e) { next(e); }
});

adminRouter.post('/customers/:userId/active', async (req: any, res, next) => {
  try {
    res.json(ok(await adminService.setUserActive(req.params.userId, Boolean(req.body?.isActive))));
  } catch (e) { next(e); }
});

// Categories
adminRouter.post('/categories', async (req: any, res, next) => {
  try {
    const { name, slug, description, icon } = req.body;
    res.status(201).json(ok(await adminService.createCategory(name, slug, description, icon)));
  } catch (e) { next(e); }
});

adminRouter.patch('/categories/:id', async (req: any, res, next) => {
  try {
    res.json(ok(await adminService.updateCategory(req.params.id, req.body)));
  } catch (e) { next(e); }
});

adminRouter.delete('/categories/:id', async (req, res, next) => {
  try {
    res.json(ok(await adminService.deleteCategory(req.params.id)));
  } catch (e) { next(e); }
});

// Services
adminRouter.post('/services', async (req: any, res, next) => {
  try {
    const { categoryId, name, slug, description } = req.body;
    res.status(201).json(ok(await adminService.createService(categoryId, name, slug, description)));
  } catch (e) { next(e); }
});

adminRouter.patch('/services/:id', async (req: any, res, next) => {
  try {
    res.json(ok(await adminService.updateService(req.params.id, req.body)));
  } catch (e) { next(e); }
});