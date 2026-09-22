export type Role = 'CUSTOMER' | 'WORKER' | 'ADMIN';

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  category?: ServiceCategory;
}

export interface WorkerCardData {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  verified: boolean;
  boosted?: boolean;
  ratingAverage: number;
  ratingCount: number;
  experienceYears: number;
  completedJobs: number;
  city: string | null;
  startingPrice: number | null;
  services: Array<{
    id: string;
    name: string;
    slug: string;
    pricingType: 'FIXED' | 'STARTING_FROM' | 'HOURLY' | 'QUOTE_REQUIRED';
    startingPrice: number | null;
    hourlyRate: number | null;
    fixedPrice: number | null;
    category: string | null;
  }>;
  distanceKm: number | null;
  emergencyAvailable: boolean;
  portfolio: string[];
}

export interface WorkerProfileData {
  id: string;
  userId: string;
  bio: string | null;
  experienceYears: number;
  city: string | null;
  addressLine: string | null;
  serviceRadiusKm: number;
  emergencyAvailable: boolean;
  completedJobs: number;
  ratingAverage: number;
  ratingCount: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  services: Array<{
    id: string;
    service: { id: string; name: string; slug: string; category: { name: string } | null };
    pricingType: string;
    startingPrice: number | null;
    hourlyRate: number | null;
    fixedPrice: number | null;
    estimatedMinutes: number | null;
    emergencyAvailable: boolean;
  }>;
  portfolio: Array<{ id: string; imageUrl: string; caption: string | null }>;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    createdAt: string;
    reviewsReceived: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      author: { fullName: string; avatarUrl: string | null };
      booking: { request: { service: { name: string } } };
    }>;
    _count: { reviewsReceived: number };
  };
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
  expiresAt: string | null;
  createdAt: string;
  service: { id: string; name: string; slug: string; category: { name: string; slug: string } };
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
  worker?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    workerProfile?: {
      ratingAverage: number;
      ratingCount: number;
      completedJobs: number;
      experienceYears: number;
      verificationStatus: string;
    };
  };
}

export interface Booking {
  id: string;
  requestId: string;
  customerId: string;
  workerId: string;
  status: 'CONFIRMED' | 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
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
  method: 'CASH_ON_COMPLETION' | 'KBZPAY' | 'WAVE_MONEY' | 'AYA_PAY' | 'STRIPE';
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

export interface FavoriteItem {
  id: string;
  workerProfileId: string;
  workerProfile: {
    id: string;
    user: { id: string; fullName: string; avatarUrl: string | null };
    services: Array<{ service: { id: string; name: string; slug: string } }>;
  };
}