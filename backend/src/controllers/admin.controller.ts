import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { adminService } from '../services/admin.service';
import { errors, ok } from '../utils/api';

const handle = (action: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  async (req, res, next) => {
    try { await action(req, res); } catch (error) { next(error); }
  };

const userListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['CUSTOMER', 'WORKER', 'ADMIN', 'all']).default('all'), status: z.enum(['active', 'banned', 'inactive', 'all']).default('all'), q: z.string().optional(),
});
const workerListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED', 'all']).default('all'), q: z.string().optional(),
});
const reasonSchema = z.object({ reason: z.string().min(1) });
const kycListSchema = z.object({ status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO', 'all']).default('PENDING'), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) });
const kycReviewSchema = z.object({ action: z.enum(['APPROVE', 'REJECT', 'NEEDS_MORE_INFO']), reason: z.string().optional(), adminNotes: z.string().optional() });
const bookingListSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), status: z.enum(['all', 'CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']).default('all') });
const refundSchema = z.object({ amount: z.number().int().min(0), reason: z.string().min(1) });
const categorySchema = z.object({ name: z.string().min(1), slug: z.string().min(1), icon: z.string().optional(), description: z.string().optional(), sortOrder: z.number().int().optional() });
const roleSchema = z.object({ slug: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/), name: z.string().min(1), description: z.string().optional(), permissions: z.array(z.string()).min(1) });
const roleUpdateSchema = z.object({ name: z.string().min(1).optional(), description: z.string().optional(), permissions: z.array(z.string()).min(1).optional() });
const assignSchema = z.object({ roleIds: z.array(z.string()).min(1) });
const auditSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(50), actorId: z.string().optional(), action: z.string().optional() });
const broadcastSchema = z.object({ segment: z.enum(['all', 'customers', 'workers', 'admins']), title: z.string().min(1).max(200), body: z.string().min(1).max(1000) });
const paymentListSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), status: z.enum(['all', 'COMPLETED', 'REFUNDED', 'PENDING']).default('all') });
const reviewListSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), minRating: z.coerce.number().int().min(1).max(5).optional() });
const disputeListSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), status: z.enum(['all', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).default('all') });
const disputeResolveSchema = z.object({ resolution: z.string().min(1), refundAmount: z.number().int().min(0).optional() });

export const adminController = {
  me: handle(async (req, res) => {
    if (req.user?.role !== 'ADMIN') throw errors.forbidden('Admins only');
    res.json(ok(await adminService.meWithRolesAndPermissions(req.user.sub)));
  }),
  analytics: handle(async (_req, res) => { res.json(ok(await adminService.analytics())); }),
  listUsers: handle(async (req, res) => { res.json(ok(await adminService.listUsers(userListSchema.parse(req.query)))); }),
  getUser: handle(async (req, res) => { res.json(ok(await adminService.getUserFull(req.params.id))); }),
  banUser: handle(async (req, res) => { const { reason } = reasonSchema.parse(req.body); res.json(ok(await adminService.banUser(req.user!.sub, req.params.id, reason))); }),
  unbanUser: handle(async (req, res) => { res.json(ok(await adminService.unbanUser(req.user!.sub, req.params.id))); }),
  deleteUser: handle(async (req, res) => { res.json(ok(await adminService.deleteUser(req.user!.sub, req.params.id))); }),
  impersonate: handle(async (req, res) => { res.json(ok(await adminService.impersonate(req.user!.sub, req.params.id))); }),
  listWorkers: handle(async (req, res) => { res.json(ok(await adminService.listWorkers(workerListSchema.parse(req.query)))); }),
  approveWorker: handle(async (req, res) => { res.json(ok(await adminService.approveWorker(req.user!.sub, req.params.id))); }),
  rejectWorker: handle(async (req, res) => { const { reason } = reasonSchema.parse(req.body); res.json(ok(await adminService.rejectWorker(req.user!.sub, req.params.id, reason))); }),
  suspendWorker: handle(async (req, res) => { const { reason } = reasonSchema.parse(req.body); res.json(ok(await adminService.suspendWorker(req.user!.sub, req.params.id, reason))); }),
  workerDocuments: handle(async (req, res) => { res.json(ok(await adminService.workerDocuments(req.params.id))); }),
  workerKycDetails: handle(async (req, res) => { res.json(ok(await adminService.workerKycDetails(req.params.id))); }),
  listKyc: handle(async (req, res) => { res.json(ok(await adminService.listKyc(kycListSchema.parse(req.query)))); }),
  reviewKyc: handle(async (req, res) => { res.json(ok(await adminService.reviewKyc(req.user!.sub, req.params.id, kycReviewSchema.parse(req.body)))); }),
  listBookings: handle(async (req, res) => { res.json(ok(await adminService.listBookings(bookingListSchema.parse(req.query)))); }),
  refundBooking: handle(async (req, res) => { const body = refundSchema.parse(req.body); res.json(ok(await adminService.refundBooking(req.user!.sub, req.params.id, body.amount, body.reason))); }),
  listCategories: handle(async (_req, res) => { res.json(ok(await adminService.listCategories())); }),
  createCategory: handle(async (req, res) => { res.json(ok(await adminService.createCategory(req.user!.sub, categorySchema.parse(req.body)))); }),
  updateCategory: handle(async (req, res) => { res.json(ok(await adminService.updateCategory(req.user!.sub, req.params.id, categorySchema.partial().parse(req.body)))); }),
  deleteCategory: handle(async (req, res) => { res.json(ok(await adminService.deleteCategory(req.user!.sub, req.params.id))); }),
  listRoles: handle(async (_req, res) => { res.json(ok(await adminService.listRoles())); }),
  listPermissions: handle(async (_req, res) => { res.json(ok(await adminService.listPermissions())); }),
  createRole: handle(async (req, res) => { res.json(ok(await adminService.createRole(req.user!.sub, roleSchema.parse(req.body)))); }),
  updateRole: handle(async (req, res) => { res.json(ok(await adminService.updateRole(req.user!.sub, req.params.id, roleUpdateSchema.parse(req.body)))); }),
  deleteRole: handle(async (req, res) => { res.json(ok(await adminService.deleteRole(req.user!.sub, req.params.id))); }),
  assignRoles: handle(async (req, res) => { const { roleIds } = assignSchema.parse(req.body); res.json(ok(await adminService.assignRoles(req.user!.sub, req.params.userId, roleIds))); }),
  getConfig: handle(async (_req, res) => { res.json(ok(await adminService.getConfig())); }),
  updateConfig: handle(async (req, res) => { res.json(ok(await adminService.updateConfig(req.user!.sub, z.record(z.any()).parse(req.body)))); }),
  listAudit: handle(async (req, res) => { res.json(ok(await adminService.listAudit(auditSchema.parse(req.query)))); }),
  broadcast: handle(async (req, res) => { res.json(ok(await adminService.broadcast(req.user!.sub, broadcastSchema.parse(req.body)))); }),
  getPricing: handle(async (_req, res) => { res.json(ok(await adminService.getPricing())); }),
  updatePricing: handle(async (req, res) => { res.json(ok(await adminService.updatePricing(req.params.id, req.body))); }),
  listPayments: handle(async (req, res) => { res.json(ok(await adminService.listPayments(paymentListSchema.parse(req.query)))); }),
  listReviews: handle(async (req, res) => { res.json(ok(await adminService.listReviews(reviewListSchema.parse(req.query)))); }),
  deleteReview: handle(async (req, res) => { res.json(ok(await adminService.deleteReview(req.user!.sub, req.params.id))); }),
  listDisputes: handle(async (req, res) => { res.json(ok(await adminService.listDisputes(disputeListSchema.parse(req.query)))); }),
  resolveDispute: handle(async (req, res) => { res.json(ok(await adminService.resolveDispute(req.user!.sub, req.params.id, disputeResolveSchema.parse(req.body)))); }),
};
