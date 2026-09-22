import { apiClient, extractError } from './client';

export type AdminUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  isActive: boolean;
  isBanned: boolean;
  workerProfile?: { city: string | null; verificationStatus: string } | null;
  roles?: { id: string; slug: string; name: string }[];
  permissions?: string[];
  createdAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  serviceCount: number;
  isActive: boolean;
};

export type AdminWorker = {
  id: string; userId: string; fullName: string; email: string | null; phone: string | null;
  avatarUrl: string | null; city: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  ratingAverage: number; ratingCount: number; completedJobs: number;
};

export type KycDocument = {
  id: string; workerProfileId: string; type: string; status: string;
  fileUrl: string; fileName: string; documentNumber: string | null;
  workerName?: string; workerEmail?: string; createdAt: string;
};

export type AdminBooking = {
  id: string; status: string; serviceName: string;
  customerName: string; workerName: string;
  total: number; platformFee: number; workerEarnings: number;
  createdAt: string; completedAt: string | null;
};

export type AdminRole = {
  id: string; slug: string; name: string; description: string | null;
  isBuiltIn: boolean; permissions: string[]; userCount: number;
};

export type Permission = { id: string; key: string; resource: string; action: string; description: string | null };

export type PlatformConfig = {
  id: string; siteName: string; supportEmail: string; supportPhone: string;
  commissionPercent: number; defaultCurrency: string;
  maxUploadMb: number; maxRequestPhotoCount: number;
  enableChat: boolean; enableBookings: boolean; enableBoosts: boolean; enableAnalytics: boolean;
  termsOfServiceUrl: string | null; privacyPolicyUrl: string | null;
};

export type AuditEntry = {
  id: string; actorId: string; actorName: string; action: string;
  targetType: string | null; targetId: string | null; reason: string | null;
  createdAt: string;
};

export const adminApi = {
  me: () => apiClient.get('/admin/me').then((r) => r.data.data),
  analytics: () => apiClient.get('/admin/analytics').then((r) => r.data.data),
  listUsers: (params: { page?: number; pageSize?: number; q?: string; role?: string; status?: string } = {}) =>
    apiClient.get('/admin/users', { params }).then((r) => r.data.data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`).then((r) => r.data),
  banUser: (id: string, reason: string) => apiClient.post(`/admin/users/${id}/ban`, { reason }).then((r) => r.data),
  unbanUser: (id: string) => apiClient.post(`/admin/users/${id}/unban`).then((r) => r.data),
  listWorkers: (params: { page?: number; pageSize?: number; q?: string; status?: string } = {}) =>
    apiClient.get('/admin/workers', { params }).then((r) => r.data.data),
  approveWorker: (id: string) => apiClient.post(`/admin/workers/${id}/approve`).then((r) => r.data),
  rejectWorker: (id: string, reason: string) => apiClient.post(`/admin/workers/${id}/reject`, { reason }).then((r) => r.data),
  suspendWorker: (id: string, reason: string) => apiClient.post(`/admin/workers/${id}/suspend`, { reason }).then((r) => r.data),
  listKyc: (params: { status?: string; page?: number; pageSize?: number } = {}) =>
    apiClient.get('/admin/kyc', { params }).then((r) => r.data.data),
  workerDocuments: (workerProfileId: string) =>
    apiClient.get(`/admin/workers/${workerProfileId}/documents`).then((r) => r.data.data),
  reviewKyc: (id: string, body: { action: string; reason?: string; adminNotes?: string }) =>
    apiClient.post(`/admin/kyc/${id}/review`, body).then((r) => r.data),
  listBookings: (params: { page?: number; pageSize?: number; status?: string } = {}) =>
    apiClient.get('/admin/bookings', { params }).then((r) => r.data.data),
  refundBooking: (id: string, amount: number, reason: string) =>
    apiClient.post(`/admin/bookings/${id}/refund`, { amount, reason }).then((r) => r.data),
  listCategories: () => apiClient.get('/admin/categories').then((r) => r.data.data),
  createCategory: (b: any) => apiClient.post('/admin/categories', b).then((r) => r.data),
  updateCategory: (id: string, body: any) => apiClient.patch(`/admin/categories/${id}`, body).then((r) => r.data),
  deleteCategory: (id: string) => apiClient.delete(`/admin/categories/${id}`).then((r) => r.data),
  getPricing: () => apiClient.get('/admin/pricing').then((r) => r.data.data),
  listPayments: (params: { page?: number; pageSize?: number; status?: string } = {}) =>
    apiClient.get('/admin/payments', { params }).then((r) => r.data.data),
  listRoles: () => apiClient.get('/admin/roles').then((r) => r.data.data),
  getPermissions: () => apiClient.get('/admin/permissions').then((r) => r.data.data),
  createRole: (body: { slug: string; name: string; description?: string; permissions: string[] }) =>
    apiClient.post('/admin/roles', body).then((r) => r.data),
  updateRole: (id: string, body: { name?: string; description?: string; permissions?: string[] }) =>
    apiClient.patch(`/admin/roles/${id}`, body).then((r) => r.data),
  deleteRole: (id: string) => apiClient.delete(`/admin/roles/${id}`).then((r) => r.data),
  getConfig: () => apiClient.get('/admin/config').then((r) => r.data.data),
  updateConfig: (body: any) => apiClient.patch('/admin/config', body).then((r) => r.data.data),
  listAudit: (params: { page?: number; pageSize?: number; actorId?: string; action?: string } = {}) =>
    apiClient.get('/admin/audit', { params }).then((r) => r.data.data),
  broadcast: (body: { segment: string; title: string; body: string }) =>
    apiClient.post('/admin/notifications/broadcast', body).then((r) => r.data),
  listReviews: (params: { page?: number; pageSize?: number; minRating?: number } = {}) =>
    apiClient.get('/admin/reviews', { params }).then((r) => r.data.data),
  deleteReview: (id: string) => apiClient.delete(`/admin/reviews/${id}`).then((r) => r.data),
  listDisputes: (params: { page?: number; pageSize?: number; status?: string } = {}) =>
    apiClient.get('/admin/disputes', { params }).then((r) => r.data.data),
  resolveDispute: (id: string, body: { resolution: string; refundAmount?: number }) =>
    apiClient.patch(`/admin/disputes/${id}/resolve`, body).then((r) => r.data),
};
export { extractError };
