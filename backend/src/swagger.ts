// OpenAPI 3.0 spec generator. Reads the live route table at startup and
// produces a spec that includes:
//   - All /api/v1/:locale/* and /api/* routes (with their method+path)
//   - All known schemas (the Prisma models we expose via endpoints)
//   - Standard error responses (BAD_REQUEST, VALIDATION_ERROR,
//     UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_ERROR)
//   - Localized descriptions so the docs UI itself is translated
//   - Server URL examples for the versioned and legacy paths
//
// The spec is served at:
//   GET /api/docs.json   – machine-readable OpenAPI JSON
//   GET /api/docs        – Swagger UI
//   GET /api/v1/:locale/docs(.json) – same for the versioned path

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { LOCALES, type ApiLocale } from './middleware/i18n';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface RouteInfo {
  method: Method;
  path: string;        // e.g. /api/v1/:locale/auth/login
  fullPath: string;    // e.g. /api/v1/{locale}/auth/login (OpenAPI form)
  summary: string;
  description: string;
  auth: 'public' | 'customer-or-worker' | 'worker' | 'customer' | 'admin';
  bodySchema?: string; // $ref to a schema name
  querySchema?: Array<{ name: string; in: 'query' | 'path'; required: boolean; type: string; description: string }>;
}

// ---------- localized UI strings ----------
const UI_STRINGS: Record<string, Record<ApiLocale, string>> = {
  title:         { en: 'Local Services Marketplace API',       zh: '本地服务市场 API',     my: 'ပြည်တွင်းဝန်ဆောင်မှု စျေးကွက် API', th: 'API ตลาดบริการในพื้นที่', hi: 'स्थानीय सेवा मार्केटप्लेस API' },
  description:   { en: 'REST API + Socket.IO for the Local Services Marketplace platform.', zh: '本地服务市场平台的 REST API 和 Socket.IO。', my: 'ပြည်တွင်းဝန်ဆောင်မှု စျေးကွက် ပလက်ဖောင်းအတွက် REST API + Socket.IO။', th: 'REST API + Socket.IO สำหรับแพลตฟอร์มตลาดบริการในพื้นที่', hi: 'स्थानीय सेवा मार्केटप्लेस प्लेटफ़ॉर्म के लिए REST API + Socket.IO।' },
  sectionAuth:   { en: 'Authentication',                  zh: '认证',                  my: 'အထောက်အထာင်း',                th: 'การยืนยันตัวตน',                hi: 'प्रमाणीकरण' },
  sectionUsers:  { en: 'Users & profile',                    zh: '用户与资料',            my: 'အသုံးပြုသူများနှင့် ပရိုဖိုင်',   th: 'ผู้ใช้และโปรไฟล์',                hi: 'उपयोगकर्ता और प्रोफ़ाइल' },
  sectionWork:   { en: 'Workers',                            zh: '服务者',                my: 'ဝန်ဆောင်ပေးသူများ',                 th: 'ผู้ให้บริการ',                    hi: 'कार्यकर्ता' },
  sectionRequest:{ en: 'Service requests',                   zh: '服务请求',              my: 'ဝန်ဆောင်မှု တောင်းဆိုချက်များ',     th: 'คำขอบริการ',                      hi: 'सेवा अनुरोध' },
  sectionQuote:  { en: 'Quotes',                             zh: '报价',                  my: 'စျေးနှုန်းများ',                       th: 'ใบเสนอราคา',                      hi: 'उद्धरण' },
  sectionBook:   { en: 'Bookings',                           zh: '预约',                  my: 'ချိန်းဆိုခြင်းများ',                     th: 'การจอง',                          hi: 'बुकिंग' },
  sectionChat:   { en: 'Chat & messages',                    zh: '聊天与消息',            my: 'ချတ်နှင့် မက်ဆေ့ဂျ်များ',           th: 'แชทและข้อความ',                  hi: 'चैट और संदेश' },
  sectionFav:    { en: 'Favorites',                          zh: '收藏',                  my: 'အကြိုက်ဆုံးများ',                   th: 'รายการโปรด',                      hi: 'पसंदीदा' },
  sectionNotif:  { en: 'Notifications',                     zh: '通知',                  my: 'အကြောင်းကြားများ',                    th: 'การแจ้งเตือน',                    hi: 'सूचनाएँ' },
  sectionPay:    { en: 'Payments',                          zh: '支付',                  my: 'ငွေပေးချောင်း',                       th: 'การชำระเงิน',                    hi: 'भुगतान' },
  sectionRev:    { en: 'Reviews',                            zh: '评价',                  my: 'သုံးသပ်ချက်များ',                     th: 'รีวิว',                            hi: 'समीक्षाएँ' },
  sectionCat:    { en: 'Categories',                        zh: '服务分类',              my: 'ဝန်ဆောင်မှု အမျိုးအစားများ',        th: 'หมวดหมู่บริการ',                  hi: 'सेवा श्रेणियाँ' },
  sectionFile:   { en: 'File uploads',                       zh: '文件上传',              my: 'ဖိုင်တင်တင်ခြင်း',                  th: 'การอัปโหลดไฟล์',                  hi: 'फ़ाइल अपलोड' },
  sectionBoost:  { en: 'Profile boost',                     zh: '推广',                  my: 'ပရိုဖိုင် မြှင့်တင်',              th: 'โปรโมทโปรไฟล์',                  hi: 'प्रोफ़ाइल बूस्ट' },
  sectionAnalyt: { en: 'Analytics',                          zh: '数据分析',              my: 'သတင်းအချက်အလက်များ',                 th: 'การวิเคราะห์',                    hi: 'विश्लेषण' },
  sectionEvent:  { en: 'Event tracking',                    zh: '事件追踪',              my: 'အဖြစအပျက် ခြေရာခံခြင်း',           th: 'การติดตามเหตุการณ์',                hi: 'इवेंट ट्रैकिंग' },
  sectionDispute:{ en: 'Disputes',                          zh: '争议',                  my: 'အငြင်းအငြင်းများ',                     th: 'ข้อพิพาท',                        hi: 'विवाद' },
  sectionHealth: { en: 'Health',                             zh: '健康检查',              my: 'ကျန်းမာရေးစစ်ဆေး',                     th: 'สุขภาพ',                          hi: 'स्वास्थ्य' },
  sectionAdmin:  { en: 'Administration',                    zh: '管理后台',              my: 'စီမံခန့်ခွဲမှု',                       th: 'การจัดการระบบ',                    hi: 'प्रशासन' },
};

const t = (key: keyof typeof UI_STRINGS, locale: ApiLocale): string => {
  const table = UI_STRINGS[key];
  return table[locale] ?? table.en ?? key;
};

// ---------- route table (manually maintained, kept in sync with code) ----------
const ROUTES: RouteInfo[] = [
  // Auth
  { method: 'post',  path: '/api/auth/register',  fullPath: '/api/v1/{locale}/auth/register',  summary: 'Register',  description: 'Create a new customer or worker account', auth: 'public', bodySchema: 'RegisterRequest' },
  { method: 'post',  path: '/api/auth/login',     fullPath: '/api/v1/{locale}/auth/login',     summary: 'Login',     description: 'Email/phone + password', auth: 'public', bodySchema: 'LoginRequest' },
  { method: 'post',  path: '/api/auth/refresh',   fullPath: '/api/v1/{locale}/auth/refresh',   summary: 'Refresh',   description: 'Rotate access + refresh tokens', auth: 'public', bodySchema: 'RefreshRequest' },
  { method: 'post',  path: '/api/auth/logout',    fullPath: '/api/v1/{locale}/auth/logout',    summary: 'Logout',    description: 'Invalidate the current refresh token', auth: 'public' },
  { method: 'post',  path: '/api/auth/forgot-password', fullPath: '/api/v1/{locale}/auth/forgot-password', summary: 'Forgot password', description: 'Request a password reset link', auth: 'public', bodySchema: 'ForgotPasswordRequest' },
  { method: 'post',  path: '/api/auth/reset-password',   fullPath: '/api/v1/{locale}/auth/reset-password',   summary: 'Reset password',   description: 'Reset the password using a token', auth: 'public', bodySchema: 'ResetPasswordRequest' },

  // Users
  { method: 'get',  path: '/api/users/me',         fullPath: '/api/v1/{locale}/users/me',         summary: 'Get current user',   description: 'Returns the authenticated user profile', auth: 'customer-or-worker' },
  { method: 'patch',path: '/api/users/me',         fullPath: '/api/v1/{locale}/users/me',         summary: 'Update profile',      description: 'Update name / email / phone / avatar', auth: 'customer-or-worker', bodySchema: 'UpdateUserRequest' },
  { method: 'post', path: '/api/users/me/change-password', fullPath: '/api/v1/{locale}/users/me/change-password', summary: 'Change password', description: 'Change the current password', auth: 'customer-or-worker', bodySchema: 'ChangePasswordRequest' },

  // Workers
  { method: 'get',  path: '/api/workers',           fullPath: '/api/v1/{locale}/workers',           summary: 'Search workers',      description: 'Search workers with filters: q, service, category, city, minRating, maxPrice, verifiedOnly, emergency, sort, page, pageSize, latitude, longitude', auth: 'public', querySchema: [
    { name: 'q', in: 'query', required: false, type: 'string', description: 'Search query' },
    { name: 'service', in: 'query', required: false, type: 'string', description: 'Service slug' },
    { name: 'category', in: 'query', required: false, type: 'string', description: 'Category slug' },
    { name: 'city', in: 'query', required: false, type: 'string', description: 'City' },
    { name: 'minRating', in: 'query', required: false, type: 'number', description: 'Min rating (0-5)' },
    { name: 'maxPrice', in: 'query', required: false, type: 'integer', description: 'Max starting price (MMK)' },
    { name: 'verifiedOnly', in: 'query', required: false, type: 'boolean', description: 'Verified workers only' },
    { name: 'emergency', in: 'query', required: false, type: 'boolean', description: 'Emergency availability' },
    { name: 'sort', in: 'query', required: false, type: 'string', description: 'Sort: RECOMMENDED | NEAREST | HIGHEST_RATED | LOWEST_PRICE | MOST_EXPERIENCED' },
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
  ] },
  { method: 'get',  path: '/api/workers/recommendations', fullPath: '/api/v1/{locale}/workers/recommendations', summary: 'Recommended workers', description: 'Personalised feed based on customer activity', auth: 'customer' },
  { method: 'get',  path: '/api/workers/:id',      fullPath: '/api/v1/{locale}/workers/{id}',      summary: 'Get worker profile', description: 'Public worker profile with services, portfolio, reviews', auth: 'public' },
  { method: 'get',  path: '/api/workers/me/profile', fullPath: '/api/v1/{locale}/workers/me/profile', summary: 'My worker profile',  description: 'Current worker profile with services, portfolio, availability', auth: 'worker' },
  { method: 'patch',path: '/api/workers/me/profile', fullPath: '/api/v1/{locale}/workers/me/profile', summary: 'Update worker profile', description: 'Update bio, city, address, lat/lng, service radius, emergency availability, etc.', auth: 'worker', bodySchema: 'WorkerProfileRequest' },
  { method: 'post', path: '/api/workers/me/services',     fullPath: '/api/v1/{locale}/workers/me/services',     summary: 'Add/update a service', description: 'Add or update a service the worker offers, with pricing', auth: 'worker', bodySchema: 'WorkerServiceRequest' },
  { method: 'delete',path: '/api/workers/me/services/:serviceId', fullPath: '/api/v1/{locale}/workers/me/services/{serviceId}', summary: 'Remove a service', description: 'Stop offering a service', auth: 'worker' },
  { method: 'put',  path: '/api/workers/me/availability', fullPath: '/api/v1/{locale}/workers/me/availability', summary: 'Update availability', description: 'Set working hours (and optional time slots) for each day', auth: 'worker', bodySchema: 'AvailabilityRequest' },
  { method: 'post', path: '/api/workers/me/status',       fullPath: '/api/v1/{locale}/workers/me/status',       summary: 'Set online/offline', description: 'Toggle visibility / accepting jobs', auth: 'worker', bodySchema: 'StatusRequest' },
  { method: 'post', path: '/api/workers/me/location',     fullPath: '/api/v1/{locale}/workers/me/location',     summary: 'Update live location', description: 'Share current location during a job', auth: 'worker', bodySchema: 'LocationRequest' },
  { method: 'post', path: '/api/workers/me/portfolio',    fullPath: '/api/v1/{locale}/workers/me/portfolio',    summary: 'Add portfolio image', description: 'Upload and add a photo to your portfolio', auth: 'worker', bodySchema: 'PortfolioRequest' },
  { method: 'delete',path: '/api/workers/me/portfolio/:imageId', fullPath: '/api/v1/{locale}/workers/me/portfolio/{imageId}', summary: 'Remove portfolio image', description: 'Delete one of your portfolio images', auth: 'worker' },
  { method: 'post', path: '/api/workers/:id/favorite',  fullPath: '/api/v1/{locale}/workers/{id}/favorite',  summary: 'Favorite a worker',   description: 'Add a worker to your favorites', auth: 'customer' },
  { method: 'delete',path: '/api/workers/:id/favorite', fullPath: '/api/v1/{locale}/workers/{id}/favorite',  summary: 'Unfavorite a worker', description: 'Remove a worker from your favorites', auth: 'customer' },

  // Categories
  { method: 'get',  path: '/api/categories',         fullPath: '/api/v1/{locale}/categories',         summary: 'List categories',     description: 'List service categories with their services', auth: 'public' },
  { method: 'get',  path: '/api/services',             fullPath: '/api/v1/{locale}/services',             summary: 'List services',        description: 'List services, optionally filtered by category slug', auth: 'public' },
  { method: 'get',  path: '/api/services/:slug',       fullPath: '/api/v1/{locale}/services/{slug}',       summary: 'Get service',          description: 'Get one service by slug', auth: 'public' },

  // Requests
  { method: 'post', path: '/api/requests',                fullPath: '/api/v1/{locale}/requests',                summary: 'Create request',         description: 'Customer creates a new service request', auth: 'customer', bodySchema: 'CreateRequestRequest' },
  { method: 'get',  path: '/api/requests/mine',          fullPath: '/api/v1/{locale}/requests/mine',          summary: 'My requests',            description: 'List the customer\'s own requests', auth: 'customer' },
  { method: 'get',  path: '/api/requests/feed',          fullPath: '/api/v1/{locale}/requests/feed',          summary: 'Worker feed',            description: 'List open requests the worker is eligible for', auth: 'worker' },
  { method: 'get',  path: '/api/requests/:id',           fullPath: '/api/v1/{locale}/requests/{id}',           summary: 'Get a request',          description: 'Returns full request with photos, quotes, and booking', auth: 'customer-or-worker' },
  { method: 'post', path: '/api/requests/:id/cancel',    fullPath: '/api/v1/{locale}/requests/{id}/cancel',    summary: 'Cancel a request',       description: 'Customer cancels an open request', auth: 'customer' },
  { method: 'post', path: '/api/requests/:id/quotes',     fullPath: '/api/v1/{locale}/requests/{id}/quotes',     summary: 'Submit a quote',         description: 'Worker submits a quote (price + duration) for a request', auth: 'worker', bodySchema: 'CreateQuoteRequest' },
  { method: 'get',  path: '/api/requests/:id/quotes',     fullPath: '/api/v1/{locale}/requests/{id}/quotes',     summary: 'List quotes',           description: 'List quotes for a request (customer only)', auth: 'customer' },
  { method: 'post', path: '/api/quotes/:id/accept',      fullPath: '/api/v1/{locale}/quotes/{id}/accept',      summary: 'Accept a quote',         description: 'Customer accepts a quote; creates a booking and rejects the other quotes', auth: 'customer' },
  { method: 'post', path: '/api/quotes/:id/reject',      fullPath: '/api/v1/{locale}/quotes/{id}/reject',      summary: 'Reject a quote',         description: 'Customer rejects a quote', auth: 'customer' },
  { method: 'post', path: '/api/quotes/:id/withdraw',    fullPath: '/api/v1/{locale}/quotes/{id}/withdraw',    summary: 'Withdraw a quote',       description: 'Worker withdraws their own quote', auth: 'worker' },

  // Bookings
  { method: 'get',  path: '/api/bookings/mine',          fullPath: '/api/v1/{locale}/bookings/mine',          summary: 'My bookings',           description: 'List bookings for the current customer', auth: 'customer' },
  { method: 'get',  path: '/api/bookings/jobs',          fullPath: '/api/v1/{locale}/bookings/jobs',          summary: 'Worker jobs',            description: 'Alias of /bookings for workers', auth: 'worker' },
  { method: 'get',  path: '/api/bookings/:id',           fullPath: '/api/v1/{locale}/bookings/{id}',           summary: 'Get a booking',          description: 'Returns the booking with related request, customer/worker, payment, review', auth: 'customer-or-worker' },
  { method: 'patch',path: '/api/bookings/:id/status',    fullPath: '/api/v1/{locale}/bookings/{id}/status',    summary: 'Update booking status',  description: 'Worker advances the booking: CONFIRMED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED', auth: 'worker', bodySchema: 'BookingStatusRequest' },
  { method: 'post', path: '/api/bookings/:id/cancel',    fullPath: '/api/v1/{locale}/bookings/{id}/cancel',    summary: 'Cancel a booking',       description: 'Customer cancels an active booking', auth: 'customer', bodySchema: 'CancelBookingRequest' },
  { method: 'post', path: '/api/bookings/:id/pay',       fullPath: '/api/v1/{locale}/bookings/{id}/pay',       summary: 'Pay for a booking',      description: 'Mark a booking as paid. CASH_ON_COMPLETION is instant; gateway methods are stubbed for MVP', auth: 'customer', bodySchema: 'PayBookingRequest' },

  // Chat
  { method: 'get',  path: '/api/conversations',          fullPath: '/api/v1/{locale}/conversations',          summary: 'List conversations',    description: 'List the user\'s conversations', auth: 'customer-or-worker' },
  { method: 'get',  path: '/api/conversations/:id',      fullPath: '/api/v1/{locale}/conversations/{id}',      summary: 'Get a conversation',     description: 'Returns conversation metadata', auth: 'customer-or-worker' },
  { method: 'get',  path: '/api/conversations/:id/messages', fullPath: '/api/v1/{locale}/conversations/{id}/messages', summary: 'List messages',     description: 'Paginated list of messages in a conversation', auth: 'customer-or-worker' },
  { method: 'post', path: '/api/conversations/:id/read', fullPath: '/api/v1/{locale}/conversations/{id}/read', summary: 'Mark as read',          description: 'Mark all messages in the conversation as read by the current user', auth: 'customer-or-worker' },
  { method: 'post', path: '/api/messages',               fullPath: '/api/v1/{locale}/messages',               summary: 'Send a message',         description: 'Start a conversation (recipientId) or reply (conversationId)', auth: 'customer-or-worker', bodySchema: 'SendMessageRequest' },

  // Favorites
  { method: 'get',  path: '/api/favorites',              fullPath: '/api/v1/{locale}/favorites',              summary: 'List favorites',        description: 'List the customer\'s favorite workers', auth: 'customer' },

  // Notifications
  { method: 'get',  path: '/api/notifications',          fullPath: '/api/v1/{locale}/notifications',          summary: 'List notifications',    description: 'Paginated list of the user\'s notifications', auth: 'customer-or-worker' },
  { method: 'post', path: '/api/notifications/:id/read', fullPath: '/api/v1/{locale}/notifications/{id}/read', summary: 'Mark as read',          description: 'Mark a single notification as read', auth: 'customer-or-worker' },
  { method: 'post', path: '/api/notifications/read-all', fullPath: '/api/v1/{locale}/notifications/read-all', summary: 'Mark all as read',       description: 'Mark every notification as read', auth: 'customer-or-worker' },

  // Reviews
  { method: 'get',  path: '/api/reviews/workers/:workerId', fullPath: '/api/v1/{locale}/reviews/workers/{workerId}', summary: 'Worker reviews', description: 'Paginated reviews left about a worker', auth: 'customer-or-worker' },
  { method: 'post', path: '/api/bookings/:bookingId/review', fullPath: '/api/v1/{locale}/bookings/{bookingId}/review', summary: 'Leave a review', description: 'Customer leaves a 1-5 star review with optional comment and photos', auth: 'customer', bodySchema: 'CreateReviewRequest' },

  // Files
  { method: 'post', path: '/api/files/upload',            fullPath: '/api/v1/{locale}/files/upload',            summary: 'Upload a file',         description: 'Multipart upload; returns { url }', auth: 'customer-or-worker' },

  // Events (personalisation)
  { method: 'post', path: '/api/events',                  fullPath: '/api/v1/{locale}/events',                  summary: 'Log an event',          description: 'Log a customer activity event (search / view / click / favorite / book / chat)', auth: 'customer' },
  { method: 'post', path: '/api/events/batch',            fullPath: '/api/v1/{locale}/events/batch',            summary: 'Log a batch of events', description: 'Log up to 20 events at once', auth: 'customer' },

  // Boost
  { method: 'get',  path: '/api/pricing',                fullPath: '/api/v1/{locale}/pricing',                summary: 'Boost pricing tiers',   description: 'Public list of boost pricing tiers', auth: 'public' },
  { method: 'post', path: '/api/me/boost',                fullPath: '/api/v1/{locale}/me/boost',                summary: 'Purchase a boost',       description: 'Activate a profile boost for N days', auth: 'worker', bodySchema: 'BoostRequest' },
  { method: 'get',  path: '/api/me/boosts',               fullPath: '/api/v1/{locale}/me/boosts',               summary: 'My boosts',              description: 'List my boosts and current active status', auth: 'worker' },

  // Analytics
  { method: 'get',  path: '/api/me/analytics',            fullPath: '/api/v1/{locale}/me/analytics',            summary: 'Worker analytics',      description: 'KPIs, daily series, and source breakdown for a range (day|week|month|year|all)', auth: 'worker' },

  // Disputes
  { method: 'post', path: '/api/disputes/bookings/:bookingId', fullPath: '/api/v1/{locale}/disputes/bookings/{bookingId}', summary: 'Open a dispute', description: 'Open a dispute against a booking', auth: 'customer-or-worker', bodySchema: 'DisputeRequest' },
  { method: 'get',  path: '/api/disputes/mine',          fullPath: '/api/v1/{locale}/disputes/mine',          summary: 'My disputes',           description: 'Disputes I have opened', auth: 'customer-or-worker' },

  // Health
  { method: 'get',  path: '/health',                      fullPath: '/health',                                 summary: 'Health check',          description: 'Returns { status, env, time }', auth: 'public' },

  // Admin portal
  { method: 'get', path: '/api/admin/me', fullPath: '/api/v1/{locale}/admin/me', summary: 'Current administrator', description: 'Return the authenticated administrator with roles and permissions', auth: 'admin' },
  { method: 'get', path: '/api/admin/analytics', fullPath: '/api/v1/{locale}/admin/analytics', summary: 'Platform analytics', description: 'Return operational KPIs for the platform', auth: 'admin' },
  { method: 'get', path: '/api/admin/users', fullPath: '/api/v1/{locale}/admin/users', summary: 'List users', description: 'Search and paginate customer, worker, and administrator accounts', auth: 'admin', querySchema: [
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
    { name: 'q', in: 'query', required: false, type: 'string', description: 'Name, email, or phone search' },
    { name: 'role', in: 'query', required: false, type: 'string', description: 'CUSTOMER | WORKER | ADMIN | all' },
    { name: 'status', in: 'query', required: false, type: 'string', description: 'active | banned | inactive | all' },
  ] },
  { method: 'get', path: '/api/admin/users/:id', fullPath: '/api/v1/{locale}/admin/users/{id}', summary: 'Get user details', description: 'Return a complete user profile for administration', auth: 'admin' },
  { method: 'post', path: '/api/admin/users/:id/ban', fullPath: '/api/v1/{locale}/admin/users/{id}/ban', summary: 'Ban user', description: 'Ban a user and disable the account', auth: 'admin', bodySchema: 'AdminReasonRequest' },
  { method: 'post', path: '/api/admin/users/:id/unban', fullPath: '/api/v1/{locale}/admin/users/{id}/unban', summary: 'Unban user', description: 'Restore a banned user account', auth: 'admin' },
  { method: 'delete', path: '/api/admin/users/:id', fullPath: '/api/v1/{locale}/admin/users/{id}', summary: 'Delete user', description: 'Soft-delete a user account', auth: 'admin' },
  { method: 'post', path: '/api/admin/users/:id/impersonate', fullPath: '/api/v1/{locale}/admin/users/{id}/impersonate', summary: 'Impersonation audit', description: 'Record an administrator impersonation request', auth: 'admin' },
  { method: 'get', path: '/api/admin/workers', fullPath: '/api/v1/{locale}/admin/workers', summary: 'List workers', description: 'Search and paginate worker profiles', auth: 'admin', querySchema: [
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
    { name: 'q', in: 'query', required: false, type: 'string', description: 'Worker name, email, or city search' },
    { name: 'status', in: 'query', required: false, type: 'string', description: 'APPROVED | PENDING | REJECTED | SUSPENDED | all' },
  ] },
  { method: 'post', path: '/api/admin/workers/:id/approve', fullPath: '/api/v1/{locale}/admin/workers/{id}/approve', summary: 'Approve worker', description: 'Approve a worker profile and pending KYC documents', auth: 'admin' },
  { method: 'post', path: '/api/admin/workers/:id/reject', fullPath: '/api/v1/{locale}/admin/workers/{id}/reject', summary: 'Reject worker', description: 'Reject a worker profile with a reason', auth: 'admin', bodySchema: 'AdminReasonRequest' },
  { method: 'post', path: '/api/admin/workers/:id/suspend', fullPath: '/api/v1/{locale}/admin/workers/{id}/suspend', summary: 'Suspend worker', description: 'Suspend a worker profile with a reason', auth: 'admin', bodySchema: 'AdminReasonRequest' },
  { method: 'get', path: '/api/admin/workers/:id/documents', fullPath: '/api/v1/{locale}/admin/workers/{id}/documents', summary: 'Worker documents', description: 'List documents submitted by a worker', auth: 'admin' },
  { method: 'get', path: '/api/admin/kyc', fullPath: '/api/v1/{locale}/admin/kyc', summary: 'List KYC documents', description: 'List worker verification documents by status', auth: 'admin', querySchema: [
    { name: 'status', in: 'query', required: false, type: 'string', description: 'PENDING | UNDER_REVIEW | APPROVED | REJECTED | NEEDS_MORE_INFO | all' },
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
  ] },
  { method: 'post', path: '/api/admin/kyc/:id/review', fullPath: '/api/v1/{locale}/admin/kyc/{id}/review', summary: 'Review KYC document', description: 'Approve, reject, or request more information for a KYC document', auth: 'admin', bodySchema: 'AdminKycReviewRequest' },
  { method: 'get', path: '/api/admin/bookings', fullPath: '/api/v1/{locale}/admin/bookings', summary: 'List bookings', description: 'Search and paginate all platform bookings', auth: 'admin', querySchema: [
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
    { name: 'status', in: 'query', required: false, type: 'string', description: 'Booking status or all' },
  ] },
  { method: 'post', path: '/api/admin/bookings/:id/refund', fullPath: '/api/v1/{locale}/admin/bookings/{id}/refund', summary: 'Refund booking', description: 'Issue a booking refund and record the reason', auth: 'admin', bodySchema: 'AdminRefundRequest' },
  { method: 'get', path: '/api/admin/categories', fullPath: '/api/v1/{locale}/admin/categories', summary: 'List categories', description: 'List categories for administration', auth: 'admin' },
  { method: 'post', path: '/api/admin/categories', fullPath: '/api/v1/{locale}/admin/categories', summary: 'Create category', description: 'Create a service category', auth: 'admin', bodySchema: 'AdminCategoryRequest' },
  { method: 'patch', path: '/api/admin/categories/:id', fullPath: '/api/v1/{locale}/admin/categories/{id}', summary: 'Update category', description: 'Update a service category', auth: 'admin', bodySchema: 'AdminCategoryRequest' },
  { method: 'delete', path: '/api/admin/categories/:id', fullPath: '/api/v1/{locale}/admin/categories/{id}', summary: 'Delete category', description: 'Delete a service category', auth: 'admin' },
  { method: 'get', path: '/api/admin/roles', fullPath: '/api/v1/{locale}/admin/roles', summary: 'List roles', description: 'List administrator roles and assigned permissions', auth: 'admin' },
  { method: 'get', path: '/api/admin/permissions', fullPath: '/api/v1/{locale}/admin/permissions', summary: 'List permissions', description: 'List available permissions', auth: 'admin' },
  { method: 'post', path: '/api/admin/roles', fullPath: '/api/v1/{locale}/admin/roles', summary: 'Create role', description: 'Create a role with permissions', auth: 'admin', bodySchema: 'AdminRoleRequest' },
  { method: 'patch', path: '/api/admin/roles/:id', fullPath: '/api/v1/{locale}/admin/roles/{id}', summary: 'Update role', description: 'Update a role and its permissions', auth: 'admin', bodySchema: 'AdminRoleUpdateRequest' },
  { method: 'delete', path: '/api/admin/roles/:id', fullPath: '/api/v1/{locale}/admin/roles/{id}', summary: 'Delete role', description: 'Delete a custom role', auth: 'admin' },
  { method: 'post', path: '/api/admin/roles/assign/:userId', fullPath: '/api/v1/{locale}/admin/roles/assign/{userId}', summary: 'Assign roles', description: 'Assign roles to a user', auth: 'admin', bodySchema: 'AdminAssignRolesRequest' },
  { method: 'get', path: '/api/admin/config', fullPath: '/api/v1/{locale}/admin/config', summary: 'Get platform config', description: 'Return platform configuration', auth: 'admin' },
  { method: 'patch', path: '/api/admin/config', fullPath: '/api/v1/{locale}/admin/config', summary: 'Update platform config', description: 'Update platform configuration values', auth: 'admin', bodySchema: 'AdminConfigRequest' },
  { method: 'get', path: '/api/admin/audit', fullPath: '/api/v1/{locale}/admin/audit', summary: 'List audit entries', description: 'List administrator audit log entries', auth: 'admin', querySchema: [
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
    { name: 'actorId', in: 'query', required: false, type: 'string', description: 'Filter by administrator ID' },
    { name: 'action', in: 'query', required: false, type: 'string', description: 'Filter by action' },
  ] },
  { method: 'post', path: '/api/admin/notifications/broadcast', fullPath: '/api/v1/{locale}/admin/notifications/broadcast', summary: 'Broadcast notification', description: 'Send a notification to a user segment', auth: 'admin', bodySchema: 'AdminBroadcastRequest' },
  { method: 'get', path: '/api/admin/pricing', fullPath: '/api/v1/{locale}/admin/pricing', summary: 'List boost pricing', description: 'List boost tiers for administration', auth: 'admin' },
  { method: 'patch', path: '/api/admin/pricing/:id', fullPath: '/api/v1/{locale}/admin/pricing/{id}', summary: 'Update boost pricing', description: 'Update a boost pricing tier', auth: 'admin', bodySchema: 'AdminConfigRequest' },
  { method: 'get', path: '/api/admin/payments', fullPath: '/api/v1/{locale}/admin/payments', summary: 'List payments', description: 'List platform payments by status', auth: 'admin', querySchema: [
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
    { name: 'status', in: 'query', required: false, type: 'string', description: 'COMPLETED | REFUNDED | PENDING | all' },
  ] },
  { method: 'get', path: '/api/admin/reviews', fullPath: '/api/v1/{locale}/admin/reviews', summary: 'List reviews', description: 'List reviews for moderation', auth: 'admin', querySchema: [
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
    { name: 'minRating', in: 'query', required: false, type: 'integer', description: 'Minimum rating from 1 to 5' },
  ] },
  { method: 'delete', path: '/api/admin/reviews/:id', fullPath: '/api/v1/{locale}/admin/reviews/{id}', summary: 'Delete review', description: 'Remove a review from moderation', auth: 'admin' },
  { method: 'get', path: '/api/admin/disputes', fullPath: '/api/v1/{locale}/admin/disputes', summary: 'List disputes', description: 'List platform disputes by status', auth: 'admin', querySchema: [
    { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
    { name: 'pageSize', in: 'query', required: false, type: 'integer', description: 'Page size' },
    { name: 'status', in: 'query', required: false, type: 'string', description: 'OPEN | IN_REVIEW | RESOLVED | CLOSED | all' },
  ] },
  { method: 'patch', path: '/api/admin/disputes/:id/resolve', fullPath: '/api/v1/{locale}/admin/disputes/{id}/resolve', summary: 'Resolve dispute', description: 'Resolve a dispute and optionally refund the customer', auth: 'admin', bodySchema: 'AdminDisputeResolveRequest' },
];

// ---------- schemas ----------
const SCHEMAS: Record<string, any> = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Validation failed' },
          details: { type: 'object', additionalProperties: true, nullable: true },
        },
        required: ['code', 'message'],
      },
    },
    required: ['success', 'error'],
  },
  RegisterRequest: {
    type: 'object',
    required: ['role', 'fullName', 'password'],
    properties: {
      role:         { type: 'string', enum: ['CUSTOMER', 'WORKER'] },
      fullName:     { type: 'string' },
      email:        { type: 'string', format: 'email', nullable: true },
      phone:        { type: 'string', nullable: true },
      password:     { type: 'string', minLength: 8 },
      city:         { type: 'string', nullable: true },
      addressLine:  { type: 'string', nullable: true },
      experienceYears: { type: 'integer', minimum: 0, maximum: 80, nullable: true },
      avatarUrl:    { type: 'string', nullable: true },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['identifier', 'password'],
    properties: {
      identifier: { type: 'string' },
      password:   { type: 'string' },
    },
  },
  RefreshRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: { refreshToken: { type: 'string' } },
  },
  ForgotPasswordRequest: {
    type: 'object',
    required: ['identifier'],
    properties: { identifier: { type: 'string' } },
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['identifier', 'token', 'newPassword'],
    properties: {
      identifier:  { type: 'string' },
      token:        { type: 'string' },
      newPassword:  { type: 'string', minLength: 8 },
    },
  },
  UpdateUserRequest: {
    type: 'object',
    properties: {
      fullName: { type: 'string' },
      email:    { type: 'string', format: 'email' },
      phone:    { type: 'string' },
      avatarUrl:{ type: 'string' },
    },
  },
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string' },
      newPassword:     { type: 'string', minLength: 8 },
    },
  },
  WorkerProfileRequest: {
    type: 'object',
    properties: {
      bio:               { type: 'string', maxLength: 2000 },
      experienceYears:   { type: 'integer', minimum: 0, maximum: 80 },
      city:              { type: 'string', maxLength: 80 },
      addressLine:       { type: 'string', maxLength: 200 },
      latitude:          { type: 'number', minimum: -90, maximum: 90 },
      longitude:         { type: 'number', minimum: -180, maximum: 180 },
      serviceRadiusKm:   { type: 'integer', minimum: 1, maximum: 200 },
      emergencyAvailable:{ type: 'boolean' },
      avatarUrl:         { type: 'string' },
    },
  },
  WorkerServiceRequest: {
    type: 'object',
    required: ['serviceId', 'pricingType'],
    properties: {
      serviceId:        { type: 'string', format: 'uuid' },
      pricingType:      { type: 'string', enum: ['FIXED', 'STARTING_FROM', 'HOURLY', 'QUOTE_REQUIRED'] },
      startingPrice:    { type: 'integer', minimum: 0, nullable: true },
      hourlyRate:       { type: 'integer', minimum: 0, nullable: true },
      fixedPrice:       { type: 'integer', minimum: 0, nullable: true },
      estimatedMinutes:  { type: 'integer', minimum: 5, nullable: true },
      emergencyAvailable:{ type: 'boolean' },
      description:      { type: 'string' },
    },
  },
  AvailabilityRequest: {
    type: 'object',
    required: ['entries'],
    properties: {
      entries: {
        type: 'array',
        maxItems: 7,
        items: {
          type: 'object',
          required: ['day', 'isAvailable'],
          properties: {
            day:         { type: 'string', enum: ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'] },
            isAvailable: { type: 'boolean' },
            startTime:   { type: 'string', pattern: '^\\d{2}:\\d{2}$', nullable: true },
            endTime:     { type: 'string', pattern: '^\\d{2}:\\d{2}$', nullable: true },
          },
        },
      },
    },
  },
  StatusRequest: {
    type: 'object',
    required: ['isOnline'],
    properties: {
      isOnline:       { type: 'boolean' },
      isAcceptingJobs:{ type: 'boolean' },
    },
  },
  LocationRequest: {
    type: 'object',
    required: ['latitude', 'longitude'],
    properties: {
      latitude:  { type: 'number' },
      longitude: { type: 'number' },
    },
  },
  PortfolioRequest: {
    type: 'object',
    required: ['imageUrl'],
    properties: {
      imageUrl: { type: 'string' },
      caption:  { type: 'string' },
    },
  },
  CreateRequestRequest: {
    type: 'object',
    required: ['serviceId', 'description', 'city', 'addressLine', 'latitude', 'longitude', 'schedule'],
    properties: {
      serviceId:    { type: 'string', format: 'uuid' },
      description:  { type: 'string', minLength: 10 },
      city:         { type: 'string' },
      addressLine:  { type: 'string' },
      landmark:     { type: 'string' },
      latitude:     { type: 'number' },
      longitude:    { type: 'number' },
      schedule:     { type: 'string', enum: ['AS_SOON_AS_POSSIBLE', 'TODAY', 'TOMORROW', 'CUSTOM_DATE'] },
      scheduledAt:  { type: 'string', format: 'date-time', nullable: true },
      minBudget:     { type: 'integer', minimum: 0, nullable: true },
      maxBudget:     { type: 'integer', minimum: 0, nullable: true },
      photoUrls:     { type: 'array', items: { type: 'string' } },
    },
  },
  CreateQuoteRequest: {
    type: 'object',
    required: ['laborAmount', 'materialsAmount'],
    properties: {
      laborAmount:      { type: 'integer', minimum: 0 },
      materialsAmount:  { type: 'integer', minimum: 0 },
      additionalFee:    { type: 'integer', minimum: 0 },
      estimatedMinutes: { type: 'integer', minimum: 5 },
      message:          { type: 'string' },
    },
  },
  CancelBookingRequest: {
    type: 'object',
    properties: { reason: { type: 'string' } },
  },
  PayBookingRequest: {
    type: 'object',
    properties: { method: { type: 'string', enum: ['CASH_ON_COMPLETION', 'KBZPAY', 'WAVE_MONEY', 'AYA_PAY', 'STRIPE'] } },
  },
  CreateReviewRequest: {
    type: 'object',
    required: ['rating'],
    properties: {
      rating:  { type: 'integer', minimum: 1, maximum: 5 },
      comment: { type: 'string' },
      photos:  { type: 'array', items: { type: 'string' } },
    },
  },
  SendMessageRequest: {
    type: 'object',
    properties: {
      conversationId: { type: 'string', format: 'uuid' },
      recipientId:    { type: 'string', format: 'uuid' },
      requestId:      { type: 'string', format: 'uuid' },
      text:           { type: 'string' },
      imageUrl:       { type: 'string' },
    },
  },
  DisputeRequest: {
    type: 'object',
    required: ['reason', 'description'],
    properties: {
      reason:      { type: 'string' },
      description: { type: 'string', minLength: 10 },
    },
  },
  BoostRequest: {
    type: 'object',
    required: ['durationDays', 'amount'],
    properties: {
      durationDays: { type: 'integer', minimum: 1, maximum: 30 },
      amount:       { type: 'integer', minimum: 1000 },
      paymentMethod:{ type: 'string', enum: ['CASH_ON_COMPLETION', 'KBZPAY', 'WAVE_MONEY', 'AYA_PAY', 'STRIPE'] },
    },
  },
  AdminReasonRequest: {
    type: 'object',
    required: ['reason'],
    properties: { reason: { type: 'string', minLength: 1 } },
  },
  AdminKycReviewRequest: {
    type: 'object',
    required: ['action'],
    properties: {
      action: { type: 'string', enum: ['APPROVE', 'REJECT', 'NEEDS_MORE_INFO'] },
      reason: { type: 'string' },
      adminNotes: { type: 'string' },
    },
  },
  AdminRefundRequest: {
    type: 'object',
    required: ['amount', 'reason'],
    properties: {
      amount: { type: 'integer', minimum: 0 },
      reason: { type: 'string', minLength: 1 },
    },
  },
  AdminCategoryRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      slug: { type: 'string', minLength: 1 },
      icon: { type: 'string' },
      description: { type: 'string' },
      sortOrder: { type: 'integer' },
    },
  },
  AdminRoleRequest: {
    type: 'object',
    required: ['slug', 'name', 'permissions'],
    properties: {
      slug: { type: 'string', pattern: '^[a-z][a-z0-9_]*$' },
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      permissions: { type: 'array', minItems: 1, items: { type: 'string' } },
    },
  },
  AdminRoleUpdateRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      permissions: { type: 'array', minItems: 1, items: { type: 'string' } },
    },
  },
  AdminAssignRolesRequest: {
    type: 'object',
    required: ['roleIds'],
    properties: { roleIds: { type: 'array', minItems: 1, items: { type: 'string' } } },
  },
  AdminConfigRequest: {
    type: 'object',
    additionalProperties: true,
    description: 'Configuration fields accepted by the selected administration endpoint.',
  },
  AdminBroadcastRequest: {
    type: 'object',
    required: ['segment', 'title', 'body'],
    properties: {
      segment: { type: 'string', enum: ['all', 'customers', 'workers', 'admins'] },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      body: { type: 'string', minLength: 1, maxLength: 1000 },
    },
  },
  AdminDisputeResolveRequest: {
    type: 'object',
    required: ['resolution'],
    properties: {
      resolution: { type: 'string', minLength: 1 },
      refundAmount: { type: 'integer', minimum: 0 },
    },
  },
};

// ---------- spec builder ----------
export function buildSpec(locale: ApiLocale) {
  const spec: any = {
    openapi: '3.0.3',
    info: {
      title:       t('title', locale),
      description: t('description', locale),
      version:     '1.0.0',
      contact: { name: 'Local Services Marketplace', email: 'support@local-services.example' },
    },
    servers: [
      { url: 'http://localhost:4000',                          description: 'Direct (legacy /api/*)' },
      { url: 'http://localhost:4000/api/v1/{locale}',         description: 'Versioned + localized — replace {locale} with en, zh, my, th, or hi' },
    ],
    components: { schemas: SCHEMAS, securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    } },
    tags: [
      { name: t('sectionAuth', locale) },
      { name: t('sectionUsers', locale) },
      { name: t('sectionWork', locale) },
      { name: t('sectionCat', locale) },
      { name: t('sectionRequest', locale) },
      { name: t('sectionQuote', locale) },
      { name: t('sectionBook', locale) },
      { name: t('sectionChat', locale) },
      { name: t('sectionFav', locale) },
      { name: t('sectionNotif', locale) },
      { name: t('sectionRev', locale) },
      { name: t('sectionFile', locale) },
      { name: t('sectionBoost', locale) },
      { name: t('sectionAnalyt', locale) },
      { name: t('sectionEvent', locale) },
      { name: t('sectionDispute', locale) },
      { name: t('sectionHealth', locale) },
      { name: t('sectionAdmin', locale) },
    ],
    paths: {} as Record<string, any>,
  };

  // Map route groups to localized tag names
  const TAG_MAP: Record<string, string> = {
    auth:          t('sectionAuth', locale),
    users:         t('sectionUsers', locale),
    workers:       t('sectionWork', locale),
    categories:    t('sectionCat', locale),
    services:      t('sectionCat', locale),
    requests:      t('sectionRequest', locale),
    quotes:        t('sectionQuote', locale),
    bookings:      t('sectionBook', locale),
    conversations: t('sectionChat', locale),
    messages:      t('sectionChat', locale),
    favorites:     t('sectionFav', locale),
    notifications: t('sectionNotif', locale),
    files:         t('sectionFile', locale),
    pricing:       t('sectionBoost', locale),
    me:            t('sectionBoost', locale),
    analytics:     t('sectionAnalyt', locale),
    events:        t('sectionEvent', locale),
    disputes:      t('sectionDispute', locale),
    health:        t('sectionHealth', locale),
    reviews:       t('sectionRev', locale),
    admin:         t('sectionAdmin', locale),
  };

  for (const r of ROUTES) {
    const opPath = r.fullPath;
    const actualPath = r.path;
    const firstSeg = actualPath.split('/').find((s: string) => s && !s.startsWith(':') && !s.startsWith('api'));
    const tagName = TAG_MAP[firstSeg ?? ''] ?? 'Workers';
    if (!spec.paths[opPath]) spec.paths[opPath] = {};
    const op: any = {
      tags: [tagName],
      summary:     r.summary,
      description: r.description,
      operationId: r.method.toUpperCase() + opPath.replace(/[\/{}:-]/g, '_'),
      responses: {
        200: { description: 'OK' },
        201: { description: 'Created' },
        400: { description: 'Bad request',         content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        401: { description: 'Unauthorized',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden',           content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        404: { description: 'Not found',           content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        409: { description: 'Conflict',            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        422: { description: 'Validation error',    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        429: { description: 'Too many requests',   content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    };
    if (r.auth !== 'public') {
      op.security = [{ bearerAuth: [] }];
    }
    if (r.bodySchema) {
      op.requestBody = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/' + r.bodySchema } } } };
    }
    if (r.querySchema && r.querySchema.length) {
      op.parameters = r.querySchema.map((q) => ({
        name: q.name, in: q.in, required: q.required, schema: { type: q.type }, description: q.description,
      }));
    }
    spec.paths[opPath][r.method] = op;
  }
  return spec;
}

// ---------- Express routes ----------
const SWAGGER_HTML_PATH = path.join(process.cwd(), 'src', 'swagger', 'index.html');

export function docsRouter() {
  const r = Router();
  // Versioned + localized docs: /api/v1/:locale/docs(.json)
  r.get('/v1/:locale/docs.json', (req: Request, res: Response) => {
    const locale = (req.params.locale as ApiLocale) ?? 'en';
    res.json(buildSpec(locale));
  });
  r.get('/v1/:locale/docs', (req: Request, res: Response, next) => {
    const locale = (req.params.locale as ApiLocale) ?? 'en';
    // Inject locale into the Swagger UI config so "Try it out" uses the right path.
    const lang = LOCALES.find((l) => l.code === locale) ? locale : 'en';
    const html = renderSwaggerHtml(lang);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
  // Legacy: /api/docs(.json) — uses Accept-Language or default
  r.get('/docs.json', (req: Request, res: Response) => {
    const locale = detectLangFromHeader(req.headers['accept-language']);
    res.json(buildSpec(locale));
  });
  r.get('/docs', (req: Request, res: Response, next) => {
    const locale = detectLangFromHeader(req.headers['accept-language']);
    const html = renderSwaggerHtml(locale);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
  return r;
}

function detectLangFromHeader(h?: string): ApiLocale {
  if (!h) return 'en';
  if (h.startsWith('zh')) return 'zh';
  if (h.startsWith('my')) return 'my';
  if (h.startsWith('th')) return 'th';
  if (h.startsWith('hi')) return 'hi';
  return 'en';
}

function renderSwaggerHtml(locale: ApiLocale): string {
  // A standalone HTML page that loads Swagger UI from a CDN and points it at
  // our spec endpoint. We do this instead of using swagger-ui-express's
  // built-in middleware to avoid extra CSS conflicts and to keep the HTML
  // bundle in source control.
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t('title', locale)}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body { margin: 0; } .swagger-ui .topbar { display: none; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      const specUrl = location.pathname.endsWith('.json')
        ? location.pathname
        : location.pathname.replace(/\\/$/, '') + '.json';
      window.ui = SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
        supportedSubmitMethods: ['get', 'post', 'put', 'patch', 'delete'],
      });
    };
  </script>
</body>
</html>`;
}

// Export the swagger UI mount as a helper if anyone wants it on a different
// path. (Not used in app.ts right now — we serve the static HTML above.)
export function mountSwaggerUi(router: import('express').Router, path: string) {
  const indexHtml = fs.existsSync(SWAGGER_HTML_PATH) ? fs.readFileSync(SWAGGER_HTML_PATH, 'utf-8') : renderSwaggerHtml('en');
  router.get(path, (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.send(indexHtml); });
  router.use(path, swaggerUi.serve);
}