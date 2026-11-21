import { apiClient, extractData } from './client';
import {
  AuthResponse,
  User,
  WorkerProfile,
  Service,
  ServiceCategory,
  WorkerService,
  WorkerAvailability,
  PaginatedResponse,
  ServiceRequest,
  Booking,
  Quote,
  Conversation,
  Message,
  NotificationItem,
  EarningsSummary,
} from '@/types';

export const authApi = {
  register: (input: { fullName: string; email?: string; phone?: string; password: string; city?: string; addressLine?: string; experienceYears?: number }) =>
    apiClient.post('/auth/register', { role: 'WORKER', ...input }).then((r) => extractData<AuthResponse>(r)),
  login: (identifier: string, password: string) =>
    apiClient.post('/auth/login', { identifier, password }).then((r) => extractData<AuthResponse>(r)),
  logout: () => apiClient.post('/auth/logout').then((r) => extractData<unknown>(r)),
};

export const userApi = {
  me: () => apiClient.get('/users/me').then((r) => extractData<User & { workerProfile: WorkerProfile | null }>(r)),
  updateProfile: (input: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }) =>
    apiClient.patch('/users/me', input).then((r) => extractData<User>(r)),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/users/me/change-password', { currentPassword, newPassword }).then((r) => extractData<unknown>(r)),
};

export const fileApi = {
  upload: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.post('/files/upload', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => extractData<{ url: string; fullUrl: string }>(r));
  },
};

export const categoryApi = {
  list: () => apiClient.get('/categories').then((r) => extractData<ServiceCategory[]>(r)),
};
export const serviceApi = {
  list: () => apiClient.get('/services').then((r) => extractData<Service[]>(r)),
};

export const workerApi = {
  myProfile: () => apiClient.get('/workers/me/profile').then((r) => extractData<any>(r)),
  updateProfile: (input: any) => apiClient.patch('/workers/me/profile', input).then((r) => extractData<WorkerProfile>(r)),
  submitKyc: (input: { type: string; fileUrl: string; fileName: string; documentNumber?: string; workerNotes?: string }) =>
    apiClient.post('/workers/me/kyc', input).then((r) => extractData<unknown>(r)),
  upsertService: (input: { serviceId: string; pricingType: string; startingPrice?: number; hourlyRate?: number; fixedPrice?: number; estimatedMinutes?: number; emergencyAvailable?: boolean; description?: string }) =>
    apiClient.post('/workers/me/services', input).then((r) => extractData<WorkerService>(r)),
  removeService: (serviceId: string) => apiClient.delete(`/workers/me/services/${serviceId}`).then((r) => extractData<unknown>(r)),
  setAvailability: (entries: Array<{ day: string; isAvailable: boolean; startTime?: string; endTime?: string }>) =>
    apiClient.put('/workers/me/availability', { entries }).then((r) => extractData<WorkerAvailability[]>(r)),
  setStatus: (isOnline: boolean, isAcceptingJobs?: boolean) =>
    apiClient.post('/workers/me/status', { isOnline, isAcceptingJobs }).then((r) => extractData<WorkerProfile>(r)),
  updateLocation: (latitude: number, longitude: number) =>
    apiClient.post('/workers/me/location', { latitude, longitude }).then((r) => extractData<unknown>(r)),
  addPortfolioImage: (imageUrl: string, caption?: string) =>
    apiClient.post('/workers/me/portfolio', { imageUrl, caption }).then((r) => extractData<unknown>(r)),
  removePortfolioImage: (imageId: string) =>
    apiClient.delete(`/workers/me/portfolio/${imageId}`).then((r) => extractData<unknown>(r)),
};

export const requestApi = {
  feed: (page = 1, pageSize = 20) =>
    apiClient.get('/requests/feed', { params: { page, pageSize } }).then((r) => extractData<PaginatedResponse<ServiceRequest>>(r)),
  get: (id: string) => apiClient.get(`/requests/${id}`).then((r) => extractData<ServiceRequest>(r)),
};

export const quoteApi = {
  create: (requestId: string, input: { laborAmount: number; materialsAmount: number; additionalFee?: number; estimatedMinutes?: number; message?: string }) =>
    apiClient.post(`/requests/${requestId}/quotes`, input).then((r) => extractData<Quote>(r)),
  withdraw: (quoteId: string) => apiClient.post(`/quotes/${quoteId}/withdraw`).then((r) => extractData<unknown>(r)),
};

export const bookingApi = {
  listJobs: (page = 1, pageSize = 50) =>
    apiClient.get('/bookings/jobs', { params: { page, pageSize } }).then((r) => extractData<PaginatedResponse<Booking>>(r)),
  get: (id: string) => apiClient.get(`/bookings/${id}`).then((r) => extractData<Booking>(r)),
  updateStatus: (id: string, status: string, latitude?: number, longitude?: number) =>
    apiClient.patch(`/bookings/${id}/status`, { status, latitude, longitude }).then((r) => extractData<Booking>(r)),
};

export const chatApi = {
  listConversations: () => apiClient.get('/conversations').then((r) => extractData<Conversation[]>(r)),
  getConversation: (id: string) => apiClient.get(`/conversations/${id}`).then((r) => extractData<Conversation>(r)),
  listMessages: (id: string, page = 1, pageSize = 50) =>
    apiClient.get(`/conversations/${id}/messages`, { params: { page, pageSize } }).then((r) => extractData<PaginatedResponse<Message>>(r)),
  markRead: (id: string) => apiClient.post(`/conversations/${id}/read`).then((r) => extractData<unknown>(r)),
  openConversation: (input: { recipientId: string; requestId?: string }) =>
    apiClient.post('/conversations', input).then((r) => extractData<Conversation>(r)),
  sendMessage: (input: { conversationId?: string; recipientId?: string; requestId?: string; text?: string; imageUrl?: string }) =>
    apiClient.post('/messages', input).then((r) => extractData<Message>(r)),
};

export const notificationApi = {
  list: (page = 1, pageSize = 20, unreadOnly = false) =>
    apiClient.get('/notifications', { params: { page, pageSize, unreadOnly } }).then((r) => extractData<PaginatedResponse<NotificationItem> & { unread: number }>(r)),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read`).then((r) => extractData<unknown>(r)),
  markAllRead: () => apiClient.post('/notifications/read-all').then((r) => extractData<unknown>(r)),
};

export const boostApi = {
  pricing: () => apiClient.get('/pricing').then((r) => extractData<{ tiers: Array<{ days: number; amount: number; label: string; boostFactor: number }> }>(r)),
  purchase: (input: { durationDays: number; amount: number; paymentMethod?: string }) =>
    apiClient.post('/me/boost', input).then((r) => extractData<unknown>(r)),
  myBoosts: () => apiClient.get('/me/boosts').then((r) => extractData<{ boosts: any[]; isBoosted: boolean; boostExpiresAt: string | null }>(r)),
};

export type AnalyticsRange = 'day' | 'week' | 'month' | 'year' | 'all';

export interface AnalyticsKpis {
  views: number;
  viewsDelta: number;
  favorites: number;
  favoritesDelta: number;
  bookings: number;
  bookingsDelta: number;
  chats: number;
  chatsDelta: number;
  viewToFavoritePct: number;
  viewToBookingPct: number;
  boostSharePct: number;
  organicSharePct: number;
}

export interface AnalyticsDailyPoint {
  date: string;
  views: number;
  favorites: number;
  bookings: number;
  chats: number;
}

export interface AnalyticsSource {
  source: string;
  views: number;
  favorites: number;
  bookings: number;
  chats: number;
}

export interface AnalyticsResponse {
  range: AnalyticsRange;
  from: string;
  to: string;
  isBoosted: boolean;
  boostExpiresAt: string | null;
  kpis: AnalyticsKpis;
  daily: AnalyticsDailyPoint[];
  bySource: AnalyticsSource[];
}

export const analyticsApi = {
  get: (range: AnalyticsRange) =>
    apiClient.get('/me/analytics', { params: { range } }).then((r) => extractData<AnalyticsResponse>(r)),
};

export const earningsApi = {
  summary: (): Promise<EarningsSummary> => {
    // We compute from bookings list since we don't have a dedicated endpoint
    return bookingApi.listJobs(1, 200).then((res) => {
      const completed = res.items.filter((b) => b.status === 'COMPLETED');
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      let today = 0, thisWeek = 0, thisMonth = 0, allTime = 0;
      for (const b of completed) {
        const d = new Date(b.completedAt ?? b.createdAt);
        allTime += b.workerEarnings;
        if (d >= startOfMonth) thisMonth += b.workerEarnings;
        if (d >= startOfWeek) thisWeek += b.workerEarnings;
        if (d >= startOfDay) today += b.workerEarnings;
      }
      return { today, thisWeek, thisMonth, allTime, currency: 'MMK' };
    });
  },
  recent: () => bookingApi.listJobs(1, 30),
};