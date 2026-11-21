import { Router, Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { authenticate } from '../middleware/auth';
import { adminController } from '../controllers/admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate());

function requirePermission(...keys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admins only' } });
      }
      const dbPerms = await adminService.permissionsForUser(req.user.sub);
      if (!keys.some((key) => dbPerms.includes(key) || dbPerms.includes('*'))) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Missing permission: ${keys.join(' or ')}` } });
      }
      next();
    } catch (error) { next(error); }
  };
}

adminRouter.get('/me', adminController.me);
adminRouter.get('/analytics', requirePermission('analytics:view'), adminController.analytics);

adminRouter.get('/users', requirePermission('users:view'), adminController.listUsers);
adminRouter.get('/users/:id', requirePermission('users:view'), adminController.getUser);
adminRouter.post('/users/:id/ban', requirePermission('users:ban'), adminController.banUser);
adminRouter.post('/users/:id/unban', requirePermission('users:ban'), adminController.unbanUser);
adminRouter.delete('/users/:id', requirePermission('users:delete'), adminController.deleteUser);
adminRouter.post('/users/:id/impersonate', requirePermission('users:impersonate'), adminController.impersonate);

adminRouter.get('/workers', requirePermission('workers:view'), adminController.listWorkers);
adminRouter.get('/workers/:id', requirePermission('workers:view'), adminController.getWorker);
adminRouter.post('/workers/:id/approve', requirePermission('workers:verify'), adminController.approveWorker);
adminRouter.post('/workers/:id/reject', requirePermission('workers:verify'), adminController.rejectWorker);
adminRouter.post('/workers/:id/suspend', requirePermission('workers:suspend'), adminController.suspendWorker);
adminRouter.get('/workers/:id/documents', requirePermission('kyc:view'), adminController.workerDocuments);
adminRouter.get('/workers/:id/kyc-details', requirePermission('kyc:view'), adminController.workerKycDetails);

adminRouter.get('/kyc', requirePermission('kyc:view'), adminController.listKyc);
adminRouter.post('/kyc/:id/review', requirePermission('kyc:approve'), adminController.reviewKyc);

adminRouter.get('/bookings', requirePermission('bookings:view'), adminController.listBookings);
adminRouter.get('/bookings/:id', requirePermission('bookings:view'), adminController.getBooking);
adminRouter.post('/bookings/:id/refund', requirePermission('bookings:refund'), adminController.refundBooking);

adminRouter.get('/categories', requirePermission('categories:view'), adminController.listCategories);
adminRouter.post('/categories', requirePermission('categories:create'), adminController.createCategory);
adminRouter.patch('/categories/:id', requirePermission('categories:edit'), adminController.updateCategory);
adminRouter.delete('/categories/:id', requirePermission('categories:delete'), adminController.deleteCategory);

adminRouter.get('/roles', requirePermission('roles:view'), adminController.listRoles);
adminRouter.get('/permissions', requirePermission('roles:view'), adminController.listPermissions);
adminRouter.post('/roles', requirePermission('roles:create'), adminController.createRole);
adminRouter.patch('/roles/:id', requirePermission('roles:edit'), adminController.updateRole);
adminRouter.delete('/roles/:id', requirePermission('roles:delete'), adminController.deleteRole);
adminRouter.post('/roles/assign/:userId', requirePermission('roles:assign'), adminController.assignRoles);

adminRouter.get('/config', requirePermission('config:view'), adminController.getConfig);
adminRouter.patch('/config', requirePermission('config:edit'), adminController.updateConfig);
adminRouter.get('/audit', requirePermission('audit:view'), adminController.listAudit);
adminRouter.post('/notifications/broadcast', requirePermission('notifications:broadcast'), adminController.broadcast);

adminRouter.get('/pricing', requirePermission('categories:view'), adminController.getPricing);
adminRouter.patch('/pricing/:id', requirePermission('categories:edit'), adminController.updatePricing);
adminRouter.get('/payments', requirePermission('payments:view'), adminController.listPayments);
adminRouter.get('/reviews', requirePermission('reviews:view'), adminController.listReviews);
adminRouter.delete('/reviews/:id', requirePermission('reviews:delete'), adminController.deleteReview);
adminRouter.get('/disputes', requirePermission('disputes:view'), adminController.listDisputes);
adminRouter.patch('/disputes/:id/resolve', requirePermission('disputes:resolve'), adminController.resolveDispute);
