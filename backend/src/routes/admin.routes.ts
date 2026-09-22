import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { adminService } from '../services/admin.service';
import { authenticate } from '../middleware/auth';
import { ok, errors } from '../utils/api';
import { setApiLocale, getApiLocale } from '../middleware/i18n';

export const adminRouter = Router();

// All admin routes require a valid session AND one of the
// `super_admin` / `admin` roles. The `requireRole` middleware enforces
// the role check; the `requirePermission` middleware enforces the
// fine-grained permission gate (which the server loads from the DB
// on every request so role / permission changes take effect immediately).
adminRouter.use(authenticate());

// Helper: 403 if the caller is missing a permission
function requirePermission(...keys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admins only' } });
      }
      const dbPerms = await adminService.permissionsForUser(req.user.sub);
      const okKey = keys.some((k) => dbPerms.includes(k) || dbPerms.includes('*'));
      if (!okKey) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Missing permission: ${keys.join(' or ')}` } });
      }
      next();
    } catch (e) { next(e); }
  };
}

// ---------- current admin (used to bootstrap the client) ----------
adminRouter.get('/me', async (req, res, next) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admins only' } });
    }
    const data = await adminService.meWithRolesAndPermissions(req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- analytics ----------
adminRouter.get('/analytics', requirePermission('analytics:view'), async (req, res, next) => {
  try {
    const data = await adminService.analytics();
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- users ----------
const userListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['CUSTOMER', 'WORKER', 'ADMIN', 'all']).default('all'),
  status: z.enum(['active', 'banned', 'inactive', 'all']).default('all'),
  q: z.string().optional(),
});

adminRouter.get('/users', requirePermission('users:view'), async (req, res, next) => {
  try {
    const p = userListSchema.parse(req.query);
    const data = await adminService.listUsers(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.get('/users/:id', requirePermission('users:view'), async (req, res, next) => {
  try {
    const data = await adminService.getUserFull(req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

const banSchema = z.object({ reason: z.string().min(1) });
adminRouter.post('/users/:id/ban', requirePermission('users:ban'), async (req, res, next) => {
  try {
    const { reason } = banSchema.parse(req.body);
    const data = await adminService.banUser(req.user!.sub, req.params.id, reason);
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.post('/users/:id/unban', requirePermission('users:ban'), async (req, res, next) => {
  try {
    const data = await adminService.unbanUser(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.delete('/users/:id', requirePermission('users:delete'), async (req, res, next) => {
  try {
    const data = await adminService.deleteUser(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.post('/users/:id/impersonate', requirePermission('users:impersonate'), async (req, res, next) => {
  try {
    const data = await adminService.impersonate(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- workers ----------
const workerListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED', 'all']).default('all'),
  q: z.string().optional(),
});

adminRouter.get('/workers', requirePermission('workers:view'), async (req, res, next) => {
  try {
    const p = workerListSchema.parse(req.query);
    const data = await adminService.listWorkers(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.post('/workers/:id/approve', requirePermission('workers:verify'), async (req, res, next) => {
  try {
    const data = await adminService.approveWorker(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

const rejectSchema = z.object({ reason: z.string().min(1) });
adminRouter.post('/workers/:id/reject', requirePermission('workers:verify'), async (req, res, next) => {
  try {
    const { reason } = rejectSchema.parse(req.body);
    const data = await adminService.rejectWorker(req.user!.sub, req.params.id, reason);
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.post('/workers/:id/suspend', requirePermission('workers:suspend'), async (req, res, next) => {
  try {
    const { reason } = rejectSchema.parse(req.body);
    const data = await adminService.suspendWorker(req.user!.sub, req.params.id, reason);
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.get('/workers/:id/documents', requirePermission('kyc:view'), async (req, res, next) => {
  try {
    const data = await adminService.workerDocuments(req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- KYC ----------
const kycListSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO', 'all']).default('PENDING'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

adminRouter.get('/kyc', requirePermission('kyc:view'), async (req, res, next) => {
  try {
    const p = kycListSchema.parse(req.query);
    const data = await adminService.listKyc(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});

const kycReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'NEEDS_MORE_INFO']),
  reason: z.string().optional(),
  adminNotes: z.string().optional(),
});

adminRouter.post('/kyc/:id/review', requirePermission('kyc:approve'), async (req, res, next) => {
  try {
    const body = kycReviewSchema.parse(req.body);
    const data = await adminService.reviewKyc(req.user!.sub, req.params.id, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- bookings ----------
const bookingListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['all', 'CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']).default('all'),
});

adminRouter.get('/bookings', requirePermission('bookings:view'), async (req, res, next) => {
  try {
    const p = bookingListSchema.parse(req.query);
    const data = await adminService.listBookings(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});

const refundSchema = z.object({
  amount: z.number().int().min(0),
  reason: z.string().min(1),
});

adminRouter.post('/bookings/:id/refund', requirePermission('bookings:refund'), async (req, res, next) => {
  try {
    const { amount, reason } = refundSchema.parse(req.body);
    const data = await adminService.refundBooking(req.user!.sub, req.params.id, amount, reason);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- categories ----------
adminRouter.get('/categories', requirePermission('categories:view'), async (req, res, next) => {
  try {
    const data = await adminService.listCategories();
    res.json(ok(data));
  } catch (e) { next(e); }
});

const catCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
adminRouter.post('/categories', requirePermission('categories:create'), async (req, res, next) => {
  try {
    const body = catCreateSchema.parse(req.body);
    const data = await adminService.createCategory(req.user!.sub, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});
adminRouter.patch('/categories/:id', requirePermission('categories:edit'), async (req, res, next) => {
  try {
    const body = catCreateSchema.partial().parse(req.body);
    const data = await adminService.updateCategory(req.user!.sub, req.params.id, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});
adminRouter.delete('/categories/:id', requirePermission('categories:delete'), async (req, res, next) => {
  try {
    const data = await adminService.deleteCategory(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- roles & permissions ----------
adminRouter.get('/roles', requirePermission('roles:view'), async (req, res, next) => {
  try {
    const data = await adminService.listRoles();
    res.json(ok(data));
  } catch (e) { next(e); }
});

adminRouter.get('/permissions', requirePermission('roles:view'), async (req, res, next) => {
  try {
    const data = await adminService.listPermissions();
    res.json(ok(data));
  } catch (e) { next(e); }
});

const roleCreateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'lowercase letters, numbers, underscore only'),
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1),
});
adminRouter.post('/roles', requirePermission('roles:create'), async (req, res, next) => {
  try {
    const body = roleCreateSchema.parse(req.body);
    const data = await adminService.createRole(req.user!.sub, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});
adminRouter.patch('/roles/:id', requirePermission('roles:edit'), async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      permissions: z.array(z.string()).min(1).optional(),
    }).parse(req.body);
    const data = await adminService.updateRole(req.user!.sub, req.params.id, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});
adminRouter.delete('/roles/:id', requirePermission('roles:delete'), async (req, res, next) => {
  try {
    const data = await adminService.deleteRole(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});
const assignSchema = z.object({ roleIds: z.array(z.string()).min(1) });
adminRouter.post('/roles/assign/:userId', requirePermission('roles:assign'), async (req, res, next) => {
  try {
    const { roleIds } = assignSchema.parse(req.body);
    const data = await adminService.assignRoles(req.user!.sub, req.params.userId, roleIds);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- config ----------
adminRouter.get('/config', requirePermission('config:view'), async (req, res, next) => {
  try {
    const data = await adminService.getConfig();
    res.json(ok(data));
  } catch (e) { next(e); }
});
adminRouter.patch('/config', requirePermission('config:edit'), async (req, res, next) => {
  try {
    const body = z.record(z.any()).parse(req.body);
    const data = await adminService.updateConfig(req.user!.sub, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- audit ----------
const auditSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  actorId: z.string().optional(),
  action: z.string().optional(),
});
adminRouter.get('/audit', requirePermission('audit:view'), async (req, res, next) => {
  try {
    const p = auditSchema.parse(req.query);
    const data = await adminService.listAudit(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- broadcast ----------
const broadcastSchema = z.object({
  segment: z.enum(['all', 'customers', 'workers', 'admins']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
});
adminRouter.post('/notifications/broadcast', requirePermission('notifications:broadcast'), async (req, res, next) => {
  try {
    const body = broadcastSchema.parse(req.body);
    const data = await adminService.broadcast(req.user!.sub, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- boost tiers / pricing ----------
adminRouter.get('/pricing', requirePermission('categories:view'), async (req, res, next) => {
  try {
    const data = await adminService.getPricing();
    res.json(ok(data));
  } catch (e) { next(e); }
});
adminRouter.patch('/pricing/:id', requirePermission('categories:edit'), async (req, res, next) => {
  try {
    const data = await adminService.updatePricing(req.params.id, req.body);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- payments ----------
const paymentListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['all', 'COMPLETED', 'REFUNDED', 'PENDING']).default('all'),
});
adminRouter.get('/payments', requirePermission('payments:view'), async (req, res, next) => {
  try {
    const p = paymentListSchema.parse(req.query);
    const data = await adminService.listPayments(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- reviews (admin view) ----------
const reviewListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
});
adminRouter.get('/reviews', requirePermission('reviews:view'), async (req, res, next) => {
  try {
    const p = reviewListSchema.parse(req.query);
    const data = await adminService.listReviews(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});
adminRouter.delete('/reviews/:id', requirePermission('reviews:delete'), async (req, res, next) => {
  try {
    const data = await adminService.deleteReview(req.user!.sub, req.params.id);
    res.json(ok(data));
  } catch (e) { next(e); }
});

// ---------- disputes (admin view) ----------
const disputeListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['all', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).default('all'),
});
adminRouter.get('/disputes', requirePermission('disputes:view'), async (req, res, next) => {
  try {
    const p = disputeListSchema.parse(req.query);
    const data = await adminService.listDisputes(p);
    res.json(ok(data));
  } catch (e) { next(e); }
});
const disputeResolveSchema = z.object({
  resolution: z.string().min(1),
  refundAmount: z.number().int().min(0).optional(),
});
adminRouter.patch('/disputes/:id/resolve', requirePermission('disputes:resolve'), async (req, res, next) => {
  try {
    const body = disputeResolveSchema.parse(req.body);
    const data = await adminService.resolveDispute(req.user!.sub, req.params.id, body);
    res.json(ok(data));
  } catch (e) { next(e); }
});
