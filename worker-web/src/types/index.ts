export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type Role = 'CUSTOMER' | 'WORKER' | 'ADMIN';
export type PricingType = 'FIXED' | 'STARTING_FROM' | 'HOURLY' | 'QUOTE_REQUIRED';

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number;
  city: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  isOnline: boolean;
  isAcceptingJobs: boolean;
  emergencyAvailable: boolean;
  completedJobs: number;
  ratingAverage: number;
  ratingCount: number;
  responseRate: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  portfolio?: Array<{ id: string; imageUrl: string; caption: string | null }>;
  user?: User;
  services?: WorkerService[];
  availability?: WorkerAvailability[];
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  services: Service[];
}

export interface WorkerService {
  id: string;
  workerProfileId: string;
  serviceId: string;
  pricingType: PricingType;
  startingPrice: number | null;
  hourlyRate: number | null;
  fixedPrice: number | null;
  estimatedMinutes: number | null;
  emergencyAvailable: boolean;
  description: string | null;
  service?: Service;
}

export interface WorkerAvailability {
  id: string;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

export type RequestSchedule = 'AS_SOON_AS_POSSIBLE' | 'TODAY' | 'TOMORROW' | 'CUSTOM_DATE';

export interface ServiceRequest {
  id: string;
  customerId: string;
  serviceId: string;
  description: string;
  city: string;
  addressLine: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  schedule: RequestSchedule;
  scheduledAt: string | null;
  minBudget: number | null;
  maxBudget: number | null;
  status: 'CREATED' | 'FINDING_WORKERS' | 'QUOTES_RECEIVED' | 'QUOTE_ACCEPTED' | 'BOOKING_CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  service: Service & { category: { name: string; slug: string } };
  customer: { id: string; fullName: string; avatarUrl: string | null };
  photos: Array<{ id: string; url: string }>;
  quotes: Array<Quote>;
  booking: Booking | null;
}

export interface Quote {
  id: string;
  requestId: string;
  workerId: string;
  laborAmount: number;
  materialsAmount: number;
  additionalFee: number;
  totalAmount: number;
  estimatedMinutes: number | null;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';
  expiresAt: string | null;
  createdAt: string;
  worker?: { id: string; fullName: string; avatarUrl: string | null };
}

export type BookingStatus = 'CONFIRMED' | 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface Booking {
  id: string;
  requestId: string;
  customerId: string;
  workerId: string;
  status: BookingStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  subtotal: number;
  platformFee: number;
  workerEarnings: number;
  total: number;
  commissionPercent: number;
  worker?: { id: string; fullName: string; avatarUrl: string | null };
  customer?: { id: string; fullName: string; avatarUrl: string | null };
  request?: ServiceRequest;
  payment?: Payment | null;
  review?: Review | null;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  createdAt: string;
  author?: { id: string; fullName: string; avatarUrl: string | null };
}

export interface Conversation {
  id: string;
  customerId: string;
  workerId: string;
  requestId: string | null;
  bookingId: string | null;
  lastMessageAt: string | null;
  customerUnreadCount: number;
  workerUnreadCount: number;
  customer: { id: string; fullName: string; avatarUrl: string | null };
  worker: { id: string; fullName: string; avatarUrl: string | null };
  messages?: Array<{ id: string; text: string | null; imageUrl: string | null; createdAt: string; senderId: string }>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
  sender?: { id: string; fullName: string; avatarUrl: string | null };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  currency: string;
}