import { apiClient, extractData } from './client';
import {
  AuthResponse,
  User,
  PaginatedResponse,
  ServiceCategory,
  WorkerCardData,
  WorkerProfileData,
  ServiceRequest,
  Quote,
  Booking,
  Conversation,
  Message,
  NotificationItem,
  FavoriteItem,
  RequestSchedule,
} from '@/types';

export const authApi = {
  register: (input: { role: 'CUSTOMER' | 'WORKER'; fullName: string; email?: string; phone?: string; password: string }) =>
    apiClient.post('/auth/register', input).then((r) => extractData<AuthResponse>(r)),
  login: (identifier: string, password: string) =>
    apiClient.post('/auth/login', { identifier, password }).then((r) => extractData<AuthResponse>(r)),
  logout: () => apiClient.post('/auth/logout').then((r) => extractData<unknown>(r)),
  forgotPassword: (identifier: string) =>
    apiClient.post('/auth/forgot-password', { identifier }).then((r) => extractData<unknown>(r)),
  resetPassword: (identifier: string, token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { identifier, token, newPassword }).then((r) => extractData<unknown>(r)),
};

export const userApi = {
  me: () => apiClient.get('/users/me').then((r) => extractData<User>(r)),
  updateProfile: (input: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }) =>
    apiClient.patch('/users/me', input).then((r) => extractData<User>(r)),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/users/me/change-password', { currentPassword, newPassword }).then((r) => extractData<unknown>(r)),
};

export const categoryApi = {
  list: () => apiClient.get('/categories').then((r) => extractData<ServiceCategory[]>(r)),
};

export const serviceApi = {
  list: (categorySlug?: string) =>
    apiClient.get('/services', { params: categorySlug ? { category: categorySlug } : {} }).then((r) => extractData<any[]>(r)),
};

export const workerApi = {
  search: (params: {
    q?: string;
    service?: string;
    category?: string;
    city?: string;
    minRating?: number;
    maxPrice?: number;
    verifiedOnly?: boolean;
    emergency?: boolean;
    sort?: 'RECOMMENDED' | 'NEAREST' | 'HIGHEST_RATED' | 'LOWEST_PRICE' | 'MOST_EXPERIENCED';
    page?: number;
    pageSize?: number;
    latitude?: number;
    longitude?: number;
  }) => apiClient.get('/workers', { params }).then((r) => extractData<PaginatedResponse<WorkerCardData>>(r)),
  get: (id: string) => apiClient.get(`/workers/${id}`).then((r) => extractData<WorkerProfileData>(r)),
  favorite: (id: string) => apiClient.post(`/workers/${id}/favorite`).then((r) => extractData<unknown>(r)),
  unfavorite: (id: string) => apiClient.delete(`/workers/${id}/favorite`).then((r) => extractData<unknown>(r)),
};

export const requestApi = {
  create: (input: {
    serviceId: string;
    description: string;
    city: string;
    addressLine: string;
    landmark?: string;
    latitude: number;
    longitude: number;
    schedule: RequestSchedule;
    scheduledAt?: string;
    minBudget?: number;
    maxBudget?: number;
    photoUrls?: string[];
  }) => apiClient.post('/requests', input).then((r) => extractData<ServiceRequest>(r)),
  listMine: (page = 1, pageSize = 20, status?: string) =>
    apiClient.get('/requests/mine', { params: { page, pageSize, status } }).then((r) => extractData<PaginatedResponse<ServiceRequest>>(r)),
  get: (id: string) => apiClient.get(`/requests/${id}`).then((r) => extractData<ServiceRequest>(r)),
  cancel: (id: string) => apiClient.post(`/requests/${id}/cancel`).then((r) => extractData<unknown>(r)),
};

export const quoteApi = {
  listForRequest: (requestId: string) =>
    apiClient.get(`/requests/${requestId}/quotes`).then((r) => extractData<Quote[]>(r)),
  accept: (quoteId: string) => apiClient.post(`/quotes/${quoteId}/accept`).then((r) => extractData<Booking>(r)),
  reject: (quoteId: string) => apiClient.post(`/quotes/${quoteId}/reject`).then((r) => extractData<unknown>(r)),
};

export const bookingApi = {
  listMine: (page = 1, pageSize = 20) =>
    apiClient.get('/bookings/mine', { params: { page, pageSize } }).then((r) => extractData<PaginatedResponse<Booking>>(r)),
  get: (id: string) => apiClient.get(`/bookings/${id}`).then((r) => extractData<Booking>(r)),
  cancel: (id: string, reason?: string) =>
    apiClient.post(`/bookings/${id}/cancel`, { reason }).then((r) => extractData<unknown>(r)),
  pay: (id: string, method: string) =>
    apiClient.post(`/bookings/${id}/pay`, { method }).then((r) => extractData<unknown>(r)),
};

export const reviewApi = {
  create: (bookingId: string, rating: number, comment?: string, photos?: string[]) =>
    apiClient.post(`/bookings/${bookingId}/review`, { rating, comment, photos }).then((r) => extractData<unknown>(r)),
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

export const favoriteApi = {
  list: () => apiClient.get('/favorites').then((r) => extractData<FavoriteItem[]>(r)),
  add: (workerProfileId: string) => apiClient.post(`/workers/${workerProfileId}/favorite`).then((r) => extractData<unknown>(r)),
  remove: (workerProfileId: string) => apiClient.delete(`/workers/${workerProfileId}/favorite`).then((r) => extractData<unknown>(r)),
};

export const uploadApi = {
  upload: (formData: FormData) =>
    apiClient.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => extractData<{ url: string }>(r)),
};

export const eventApi = {
  log: (input: {
    type: 'search' | 'view_service' | 'view_worker' | 'view_category' | 'click' | 'favorite' | 'book' | 'chat';
    serviceSlug?: string;
    categorySlug?: string;
    workerId?: string;
    city?: string;
    query?: string;
    source?: 'organic' | 'boost' | 'search' | 'category' | 'home' | 'profile' | 'direct' | 'favorites' | 'requests' | 'recommendations';
  }) => apiClient.post('/events', input).then((r) => extractData<unknown>(r)),
  logBatch: (events: any[]) => apiClient.post('/events/batch', { events }).then((r) => extractData<unknown>(r)),
};

export const recommendationsApi = {
  list: (params: { page?: number; pageSize?: number; latitude?: number; longitude?: number } = {}) =>
    apiClient.get('/workers/recommendations', { params }).then((r) => extractData<PaginatedResponse<WorkerCardData>>(r)),
};