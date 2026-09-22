# Local Services Marketplace

A complete on-demand local services marketplace similar to Uber, TaskRabbit, and Thumbtack, built for markets like Myanmar with MMK currency and 5-language UI support (English, 中文, မြန်မာ, ไทย, हिन्दी).

The system is split into **four independently deployable applications**:

```
local-services-marketplace/
├── customer-web/    # React + Vite + TS — for customers only
├── worker-web/      # React + Vite + TS — for workers only
├── admin-web/       # React + Vite + TS — for platform administrators
└── backend/         # Node + Express + TS — shared API + Socket.IO + Prisma
```

The three frontends are **completely independent** — they share nothing except the backend API. They can be deployed to different subdomains or origins:

| Application | Local URL | Audience |
|-------------|-----------|----------|
| Customer web | `http://localhost:5173` | Customers |
| Worker web | `http://localhost:5174` | Service workers |
| Admin web | `http://localhost:5176` | Platform administrators |
| Backend API | `http://localhost:4000` | Shared REST and WebSocket API |

---

## Table of Contents

- [Quick start](#quick-start)
- [Architecture](#architecture)
- [API documentation](#api-documentation)
- [Backend reference](#backend-reference)
- [Customer reference](#customer-web)
- [Worker reference](#worker-web)
- [Admin reference](#admin-web)
- [Data model](#data-model)
- [i18n (5 languages)](#i18n-5-languages)
- [Events and analytics](#events-and-analytics)
- [Profile boost](#profile-boost)
- [Environment variables](#environment-variables)
- [Production deployment](#production-deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Quick start

### Run on host (PostgreSQL already running)

```bash
# 1. Backend (port 4000)
cd backend
cp .env.example .env                 # adjust DATABASE_URL if needed
npm install
npx prisma migrate deploy            # or `migrate dev` for first time
npm run seed                          # populates demo data
npm run build
node dist/server.js

# 2. Customer web (port 5173)
cd ../customer-web
npm install
npm run dev -- --host 0.0.0.0 --port 5173

# 3. Worker web (port 5174)
cd ../worker-web
npm install
npm run dev -- --host 0.0.0.0 --port 5174

# 4. Admin web (port 5176)
cd ../admin-web
npm install
npm run dev -- --host 0.0.0.0 --port 5176

# 5. Helper: Postman collection
cd ../backend
npx tsx src/scripts/postman.ts en    # writes postman-collection.json
```

### Run with Docker

```bash
docker compose up --build -d
```

This starts PostgreSQL, the backend, and all three web applications. The local ports are `5433` for PostgreSQL, `4000` for the API, `5173` for customers, `5174` for workers, and `5176` for administrators. Redis is optional and is not started by the current Compose file.

To stop the stack:

```bash
docker compose down
```

To remove local database and upload volumes as well, use `docker compose down -v`.

### Demo logins (after seeding)

| Role     | Email                 | Password    |
|----------|----------------------|-------------|
| Admin    | admin@demo.com       | Admin@123   |
| Customer | customer@demo.com    | Customer@123|
| Worker   | plumber@demo.com     | Worker@123  |
| Worker   | electrician@demo.com | Worker@123  |
| Worker   | cleaner@demo.com     | Worker@123  |
| Worker   | mechanic@demo.com    | Worker@123  |

---

## Architecture

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ customer-web  │  │ worker-web    │  │ admin-web     │
│ React / Vite  │  │ React / Vite  │  │ React / Vite  │
│ :5173         │  │ :5174         │  │ :5176         │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
    └──────────────────┼──────────────────┘
           │ REST + WebSocket
           ▼
        ┌─────────────────────────┐
        │ backend                 │
        │ Express + Socket.IO     │
        │ Prisma + TypeScript     │
        │ :4000                   │
        └────────────┬────────────┘
             │
             ▼
        ┌─────────────────────────┐
        │ PostgreSQL 15            │
        │ Docker volume            │
        └─────────────────────────┘
```

Each frontend has its own application composition boundary under `src/app/`, its own routing, auth state, API client, and UI layer. The backend owns authentication, authorization, validation, business services, persistence, file uploads, and real-time events. Requests identify their frontend through the `X-App-Origin` header and can use the versioned `/api/v1/:locale/...` prefix.

### Auth model

- **JWT access tokens** (15 min) and **refresh tokens** (14 days) issued by `/api/auth/login`
- Passwords stored with **argon2id**
- **Role-based access control** (RBAC): CUSTOMER, WORKER, ADMIN
- The backend **never trusts a `role` from the request body** for privileged actions;
  the role is read from the verified JWT
- **Request access control** is contextual:
  - Customers can only view their own requests/bookings
  - Workers can view `OPEN` requests (`FINDING_WORKERS` status) to decide whether to quote
  - Workers can only view `CLOSED` requests (with booking) if they quoted or got the booking
  - Admins can view everything
- The backend can be restarted without logging users out (refresh tokens survive
  because their hash is stored in the `User.refreshTokenHash` column)

### Real-time events (Socket.IO)

Both apps connect to `ws://localhost:4000` and subscribe to user-specific rooms.
The backend emits:

| Event | When | Recipients |
|-------|------|------------|
| `request_received` | Customer creates a request | Workers in matching area/category |
| `quote_created` | Worker submits a quote | The customer who created the request |
| `quote_accepted` | Customer accepts a quote | The quoted worker |
| `quote_rejected` | Customer rejects a quote | The quoted worker |
| `request_cancelled` | Customer cancels a request | All workers who had quoted |
| `booking_status_changed` | Worker advances booking status | Both customer and worker |
| `new_message` | Either party sends a message | Both parties |
| `message_read` | Either party marks a conversation read | The other party |
| `notification_created` | Various (review, payment, etc.) | The recipient user |
| `boost:activated` | Worker purchases a boost | The worker |
| `worker:status` | Worker toggles online/offline | Their own connections (refresh cache) |

---

## API documentation

### Interactive Swagger UI

Open <http://localhost:4000/api/docs> in your browser. You'll see the full API with a "Try it out" button on every endpoint.

The Swagger UI is available in **5 languages** — choose the locale in the URL:

```
http://localhost:4000/api/docs           # English (or Accept-Language header)
http://localhost:4000/api/v1/zh/docs      # Chinese
http://localhost:4000/api/v1/my/docs      # Burmese
http://localhost:4000/api/v1/th/docs      # Thai
http://localhost:4000/api/v1/hi/docs      # Hindi
```

The page title, tag names, and operation descriptions are all translated.

### OpenAPI JSON spec

```
http://localhost:4000/api/docs.json
http://localhost:4000/api/v1/zh/docs.json
```

The same spec is rendered as the Swagger UI page. Both `info.title` and the
tag names are translated per locale.

The specification includes the customer, worker, shared, and administrator APIs.
Admin endpoints appear under the localized **Administration** tag and require a
Bearer token issued to an administrator with the required permission. The admin
portal uses the same documentation at `http://localhost:4000/api/docs`.

### Postman collection

A v2.1 collection is auto-generated from the OpenAPI spec:

```bash
cd backend
npx tsx src/scripts/postman.ts en    # writes postman-collection.json
```

Import `backend/postman-collection.json` into Postman. The collection has:

- **16 folders** (Auth, Users & Profile, Workers, Service Requests, Quotes,
  Bookings, Chat & Messages, Favorites, Notifications, Reviews, File Uploads,
  Profile Boost, Worker Analytics, Event Tracking, Disputes, Health)
- **62 pre-built requests** with method, URL, headers, body examples
- **Three variables**: `{{baseUrl}}` (default `http://localhost:4000`),
  `{{locale}}` (default `en`), `{{token}}` (paste your access token here)
- **Bearer auth** pre-configured — Postman automatically uses `{{token}}` once set

After running `/api/auth/login`, paste the returned `accessToken` into the
`{{token}}` variable and every authenticated request will work.

### Versioned API

All routes are available under **two prefixes** for backwards compatibility:

| Prefix                                 | Status      | Notes                          |
|----------------------------------------|-------------|--------------------------------|
| `/api/v1/{locale}/...`                 | Recommended | Versioned + localized          |
| `/api/...`                             | Legacy      | Uses `Accept-Language` header  |

`{locale}` is one of `en`, `zh`, `my`, `th`, `hi`. Anything else returns 400.

### Standard error response

Every error from the API returns the same shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "path": ["description"], "message": "String must contain at least 10 character(s)" }
    ]
  }
}
```

Common error codes: `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`,
`FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

The `message` is **automatically translated** based on the request's
`Accept-Language` header or the locale in the URL path.

---

## Backend reference

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (User, WorkerProfile, Service, etc.)
│   └── seed.ts                # Demo data
├── src/
│   ├── config/                # env loader
│   ├── middleware/            # auth, rate limit, i18n (localized errors)
│   ├── routes/                # HTTP route adapters and request validation
│   ├── services/              # Business logic (auth, users, workers, admin, ...)
│   ├── repositories/          # Persistence-facing data access helpers
│   ├── validators/            # Zod request schemas
│   ├── utils/                 # API responses, JWT, password, money, geo
│   ├── sockets/               # Socket.IO server
│   ├── swagger.ts             # OpenAPI spec generator (i18n)
│   ├── scripts/postman.ts      # Postman collection generator
│   └── server.ts              # entry point
├── postman-collection.json    # auto-generated
└── dist/                      # build output
```

### Tech stack

- **Node 20**, **TypeScript 5.5**, **Express 4**
- **Prisma 5** ORM with **PostgreSQL 15**
- **Argon2id** for password hashing
- **Socket.IO 4** for real-time
- **Helmet** for security headers, **CORS** configured per environment
- **Rate limit** on `/api/*` (200 req/min) and stricter on `/api/auth/*` (30 req/15min)
- **Multer** for file uploads, stored on disk under `/uploads/`
- **Zod** for request validation, **ZodResolver** with react-hook-form on the frontends
- **Pino**-style logging via `morgan`
- **i18n** with 5 locales, accepts both URL-prefix locale and `Accept-Language` header

The backend follows a layered application boundary: routes translate HTTP input into
validated service calls; services own business rules and authorization-sensitive
workflows; repositories/configuration own persistence and infrastructure concerns.
The frontends keep the same separation at a smaller scale with `app/`, `api/`,
`contexts/`, `components/`, `layouts/`, `pages/`, and `utils/` boundaries.

### Backend scripts

| Command                  | What it does                                       |
|--------------------------|----------------------------------------------------|
| `npm run dev`            | Start dev server with hot reload (tsx watch)       |
| `npm run build`          | TypeScript compile to `dist/`                       |
| `npm start`              | Run production build                                |
| `npx prisma migrate dev --name X` | Create a new migration                  |
| `npx prisma migrate deploy`     | Apply migrations to production DB         |
| `npm run seed`           | Populate demo categories, workers, customers       |
| `npx prisma studio`      | Open the Prisma DB browser                          |
| `npx tsx src/scripts/postman.ts en` | Regenerate `postman-collection.json`    |

---

## Customer-web

The customer app at `http://localhost:5173` lets users:

- Search and filter workers (location, category, service, rating, price,
  emergency availability, verified, sort)
- View personalised "Recommended for you" based on their search and view history
- View boosted workers first, with a gold "Boosted" badge
- View worker profiles with services, pricing, portfolio, reviews
- Create service requests with photos, location, schedule, budget
- Compare quotes from multiple workers, accept one (others auto-reject)
- Track bookings through their lifecycle (Confirmed → On the way → Arrived →
  In progress → Completed → Paid → Reviewed)
- Chat in real-time with workers (Socket.IO)
- Favorite workers, leave reviews, open disputes
- Get push notifications via Socket.IO

### Customer pages

| Path                        | Purpose                                       |
|-----------------------------|-----------------------------------------------|
| `/`                         | Home with hero search, recommendations       |
| `/services`                 | Searchable worker list with filters         |
| `/workers/:id`              | Worker profile (services, portfolio, reviews)|
| `/request/create`           | Create a new service request                 |
| `/requests/:id`             | Track a request (quotes, booking progress)   |
| `/bookings`                 | List of customer bookings                    |
| `/bookings/:id`             | Booking detail with status, payment, review |
| `/messages`                 | List of conversations                        |
| `/messages/:id`             | Chat thread with a worker                    |
| `/favorites`                | Saved workers                                 |
| `/notifications`            | All notifications                            |
| `/profile`                  | Edit own name/email/phone                    |
| `/settings`                 | Change password                              |
| `/login` `/register` `/forgot-password` | Auth flows                       |

---

## Worker-web

The worker app at `http://localhost:5174` lets workers:

- Complete a 4-step onboarding wizard (profile, services+pricing, availability,
  submit for review)
- Toggle **online/accepting-jobs** status from the header
- See a personalized dashboard with today's jobs, pending requests, earnings,
  and stats
- See job requests in their area that match their services
- Submit quotes (price + duration + message) on open requests
- Track accepted bookings and advance their status (On the way → Arrived → In
  progress → Completed) using the action button
- Set custom working hours per day (with optional multiple time slots per day)
- Manage their services and pricing (with bulk-add presets)
- Upload a profile photo and portfolio
- Chat with customers (Socket.IO)
- View their analytics (views, favorites, bookings, chats — with source breakdown)
- Purchase profile boosts to appear at the top of search results
- Get paid (cash on completion is the MVP flow)

### Worker pages

| Path                        | Purpose                                       |
|-----------------------------|-----------------------------------------------|
| `/dashboard`                | KPIs, recent requests, upcoming jobs, earnings |
| `/onboarding`               | 4-step setup wizard                           |
| `/requests`                 | Job request feed                              |
| `/requests/:id`             | Request detail with quote form                |
| `/jobs`                     | List of accepted jobs                          |
| `/jobs/:id`                 | Job detail with status action buttons          |
| `/calendar`                 | Weekly calendar with availability             |
| `/services`                 | Manage services + bulk-add                     |
| `/availability`             | Set working hours (multi-slot per day)         |
| `/boost`                    | Purchase profile boost                         |
| `/analytics`                | View-source breakdown, conversion metrics      |
| `/earnings`                 | Earnings summary with transaction history     |
| `/messages`                 | List of customer conversations                |
| `/messages/:id`             | Chat with a customer                          |
| `/notifications`            | All notifications                            |
| `/profile`                  | Edit profile, photo, bio, location, radius    |
| `/settings`                 | Change password                              |
| `/login` `/register`        | Auth flows                                    |

---

## Admin-web

The admin app at `http://localhost:5176` is a separate React/Vite application for
platform operations. It uses the same backend API but has its own admin token
storage, route guard, permissions model, translations, and layout.

Admin capabilities include:

- Dashboard KPIs and platform analytics
- User search, banning, unbanning, and soft deletion
- Worker approval, rejection, suspension, and KYC review
- Booking and payment oversight, including refunds
- Category and boost-tier management
- Role and permission management
- Platform configuration updates
- Audit log inspection
- Reviews, disputes, notifications, and broadcast messaging

### Admin pages

| Path | Purpose |
|------|---------|
| `/login` | Administrator authentication |
| `/dashboard` | Operational KPIs and activity summary |
| `/users` | Manage customer, worker, and admin accounts |
| `/workers` | Review worker profiles and verification state |
| `/kyc` | Review submitted identity documents |
| `/bookings` | Monitor bookings and process refunds |
| `/categories` | Manage service categories |
| `/boost-tiers` | Manage worker promotion tiers |
| `/payments` | Review payment activity |
| `/analytics` | Platform-level analytics |
| `/roles` | Manage roles and permissions |
| `/config` | Update platform configuration |
| `/audit` | Inspect administrator actions |
| `/reviews` | Moderate reviews |
| `/disputes` | Resolve booking disputes |
| `/notifications` | Review notifications |
| `/broadcast` | Send targeted notification broadcasts |

The seeded administrator is `admin@demo.com` with password `Admin@123`.

---

## Data model

The Prisma schema (`backend/prisma/schema.prisma`) defines:

- **User** — base account (email, phone, hashed password, role, avatar, last login)
- **WorkerProfile** — extended profile (bio, city, address, lat/lng, service
  radius, emergency availability, rating average/count, completed jobs count,
  isOnline, isAcceptingJobs, **isBoosted**, **boostExpiresAt**, **hasUsedBoost**,
  live latitude/longitude for active jobs)
- **WorkerService** — a service the worker offers, with pricingType
  (FIXED / STARTING_FROM / HOURLY / QUOTE_REQUIRED) and per-type prices
- **ServiceCategory** and **Service** — seeded with 4 categories and 25+ services
- **WorkerAvailability** — per-day working hours with optional **slots**
  (multiple time windows per day)
- **PortfolioImage** — worker's uploaded photos
- **WorkerDocument** — uploaded ID / certificates (for verification)
- **ServiceRequest** — customer's job request with location, schedule, photos, budget
- **RequestPhoto** — request attachments
- **Quote** — worker's offer on a request (price + duration + message)
- **Booking** — the accepted quote, with status progression
- **Payment** — payment record (status: PENDING, PAID, FAILED, REFUNDED)
- **Review** — 1-5 star rating with comment and photos
- **Dispute** — opened against a booking
- **Conversation** + **Message** — chat between customer and worker
- **Notification** — system events (request received, quote accepted, etc.)
- **Favorite** — customer's saved workers
- **CustomerEvent** — activity tracking (view / search / click) for the
  recommendations engine, with `source` field (boost / search / home / etc.)
- **Boost** — paid boost records (amount, duration, expires)
- **Address** — saved customer addresses

All models have `createdAt` / `updatedAt` and where appropriate `deletedAt`
for soft deletion. Indexes are added on the hot paths (workerId + source,
userId + createdAt, etc.).

---

## i18n (5 languages)

All three frontends ship with full translations in **English (en)**, **Chinese 中文
(zh)**, **Myanmar မြန်မာ (my)**, **Thai ไทย (th)**, **Hindi हिन्दी (hi)**.

Translation files live at:
- `customer-web/src/i18n/locales/{en,zh,my,th,hi}.json`
- `worker-web/src/i18n/locales/{en,zh,my,th,hi}.json`
- `admin-web/src/i18n/locales/{en,zh,my,th,hi}.json`

**Locale switching**: a globe icon (🌐) is in the top-right corner of every page.
Click it to open a dropdown of all 5 languages with flags. Selection is
persisted in `localStorage` and on `<html lang="...">`.

**API locale**: every frontend request sends `Accept-Language: <locale>`. The
backend uses this (or the URL path prefix) to localize error messages.

**Backend error messages** are also translated: if a Chinese user gets a
"Required" error, it arrives as "必填" in the toast.

**Server-side i18n** is implemented in `backend/src/middleware/i18n.ts` and
exposed via:
- `localizeError(code, fallback, acceptLanguage)` — looks up the message in the
  appropriate table, falls back to English, then to the provided fallback
- `setApiLocale(locale)` / `getApiLocale()` — per-request locale
- `apiVersionRouter(req, res, next)` — strips `/v1/:locale/` and sets the locale

---

## Events and analytics

Every customer interaction is logged as a `CustomerEvent` (search, view, click,
favorite, book, chat) with a `source` field (boost / search / home / category /
recommendations / direct / etc.). The `eventService.recommendations(userId)`
endpoint uses these events to build a personalized "Recommended for you" feed,
weighting:

- Recent views of a worker (boost for that worker)
- Service / category match between recent searches and the worker's services
- City match
- Distance (if location provided)
- Quality (rating, completed jobs, experience)
- Boost status
- Favorites of that worker
- Query term overlap with bio / name

Workers see the **opposite side** of this in their `/analytics` endpoint:

- **KPIs** with deltas vs. previous equal-length period: views, favorites,
  bookings, chats
- **Conversion rates**: view→favorite %, view→booking %
- **Boost share** vs. organic share of their traffic
- **Daily series** for the last 14 days (stacked bar chart: views, favorites,
  bookings, chats)
- **Source breakdown**: views by boost / search / home / category /
  recommendations / favorites / profile / direct

---

## Profile boost

Workers can purchase a **boost** to appear at the top of customer search
results. Pricing tiers:

| Days | Price (MMK) | Boost factor |
|------|-------------|--------------|
| 3    | 5,000       | 2×            |
| 7    | 9,000       | 2.5×          |
| 14   | 15,000      | 3×            |
| 30   | 25,000      | 4×            |

- MVP flow: `CASH_ON_COMPLETION` (the boost fee is deducted from the worker's
  next booking payout)
- Stubbed for production: `KBZPAY`, `WAVE_MONEY`, `AYA_PAY`, `STRIPE` are
  accepted by the API but not actually integrated yet — wire them up at the
  payment gateway in `boostService.purchaseBoost`

When a worker is boosted:
- Their worker card has a gold "Boosted" badge
- They appear at the top of customer search results
- Their views in the analytics show a "Boost" source

---

## Environment variables

All env vars are validated by `backend/src/config/env.ts` and the process will
refuse to start if any required one is missing. See `backend/.env.example` for
the full list.

### Backend

| Variable                       | Required | Default | Notes                                |
|--------------------------------|----------|---------|--------------------------------------|
| `DATABASE_URL`                 | yes      | —       | Postgres connection string          |
| `JWT_SECRET`                   | yes      | —       | Min 32 chars                        |
| `JWT_REFRESH_SECRET`           | yes      | —       | Min 32 chars                        |
| `PORT`                         | no       | 4000    |                                      |
| `NODE_ENV`                     | no       | dev     | dev / production                    |
| `CUSTOMER_WEB_URL`             | no       | `http://localhost:5173` | For CORS              |
| `WORKER_WEB_URL`               | no       | `http://localhost:5174` | For CORS              |
| `ADMIN_WEB_URL`                | no       | `http://localhost:5176` | Admin origin |
| `CORS_ORIGINS`                 | no       | Customer + worker URLs | Comma-separated list |
| `REDIS_URL`                    | no       | (none)  | Optional Redis connection           |
| `UPLOAD_DIR`                   | no       | ./uploads |                                  |
| `MAX_UPLOAD_MB`                | no       | 8       |                                      |
| `PLATFORM_COMMISSION_PERCENT`  | no       | 10      | 0–50                                |
| `DEFAULT_CURRENCY`             | no       | MMK     |                                      |

### Frontends

| Application | Variable | Required | Local default |
|-------------|----------|----------|---------------|
| Customer / worker / admin | `VITE_API_URL` | yes | `http://localhost:4000/api` |
| Customer / worker | `VITE_SOCKET_URL` | yes | `http://localhost:4000` |

For local Docker use, these values are injected in `docker-compose.yml`. For host
development, create a `.env` file in the relevant frontend directory when you need
to point at a non-default API or Socket.IO server.

---

## Production deployment

### Build artifacts

| Project       | Output                    | Runtime |
|---------------|---------------------------|---------|
| `backend`     | `dist/`                   | Node 20 |
| `customer-web`| `dist/`                   | Static web server |
| `worker-web`  | `dist/`                   | Static web server |
| `admin-web`   | `dist/`                   | Static web server |

The three frontends are static — serve them with any web server (nginx, Caddy,
Cloudflare Pages, S3+CloudFront, Vercel, or Netlify). Each SPA needs a fallback
from unknown paths to its `index.html`.

The backend is a Node 20 app — run it behind a reverse proxy (nginx, Caddy,
Cloudflare) for TLS, rate limiting, and gzip.

### Minimal nginx config for the three frontends

```nginx
server {
  listen 80;
  server_name customers.example.com;
  root /var/www/customer-web/dist;
  try_files $uri /index.html;        # SPA fallback
  add_header Cache-Control "public, max-age=3600";
}

server {
  listen 80;
  server_name workers.example.com;
  root /var/www/worker-web/dist;
  try_files $uri /index.html;
}

server {
  listen 80;
  server_name admin.example.com;
  root /var/www/admin-web/dist;
  try_files $uri /index.html;
}

server {
  listen 80;
  server_name api.example.com;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location /uploads/ { alias /var/www/lsm-uploads/; expires 7d; }
  location /socket.io/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

### Database

PostgreSQL 15+. The Prisma migrations live in `backend/prisma/migrations/`.
Run `npx prisma migrate deploy` on every deploy. **Always run this before
starting the new app version** so the DB schema is up to date.

### File uploads

Uploaded files go to `UPLOAD_DIR` (default `./uploads`). In production, mount
this as a persistent volume (e.g. EBS, EFS) and serve it directly through nginx
(as in the config above) to offload bandwidth from the Node app.

### SSL / TLS

The backend does **not** terminate TLS directly. Use a reverse proxy (Caddy,
nginx, Cloudflare) in front. Set `proxy_set_header X-Forwarded-Proto https;`
and `app.set('trust proxy', 1)` is already set.

### Backups

- **Postgres**: `pg_dump` daily, offsite
- **Uploads dir**: snapshot to S3 daily (or use S3-direct uploads in production)

---

## Testing

Run the available checks from each project directory:

```bash
# Backend
cd backend
npm run build
npm test

# Customer frontend
cd ../customer-web
npm run build
npm test

# Worker frontend
cd ../worker-web
npm run build
npm test

# Admin frontend
cd ../admin-web
npm run build
```

The main end-to-end business flow is:

1. Customer creates a request
2. Worker (in matching area) sees it
3. Worker sends a quote
4. Customer accepts → booking created, other quotes auto-reject
5. Worker advances status: CONFIRMED → ON_THE_WAY → ARRIVED → IN_PROGRESS → COMPLETED
6. Customer pays
7. Customer reviews
8. Worker's rating average updates
9. Worker's earnings update
10. Worker's profile boost (if any) shows correctly
11. Worker analytics reflect all events

### Manual test script

```bash
# Terminal 1
cd backend
node dist/server.js

# Terminal 2 (customer)
CTOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" -H "X-App-Origin: CUSTOMER_WEB" \
  -d '{"identifier":"customer@demo.com","password":"Customer@123"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])")

# Terminal 3 (worker)
WTOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" -H "X-App-Origin: WORKER_WEB" \
  -d '{"identifier":"plumber@demo.com","password":"Worker@123"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])")

# Check the returned tokens and use them for the protected request sequence.
# The admin portal can be checked with the same pattern:
ATOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" -H "X-App-Origin: ADMIN_WEB" \
  -d '{"identifier":"admin@demo.com","password":"Admin@123"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])")

curl -s http://localhost:4000/api/admin/me \
  -H "Authorization: Bearer $ATOKEN" \
  -H "X-App-Origin: ADMIN_WEB"
```

For a Docker smoke test:

```bash
docker compose up --build -d
docker compose ps
curl http://localhost:4000/health
curl -I http://localhost:5173
curl -I http://localhost:5174
curl -I http://localhost:5176
```

---

## Troubleshooting

### "Cannot find module './api'" on backend startup

You have stale build artifacts. Run `rm -rf dist && npm run build`.

### Backend won't start because of port 4000 in use

```bash
lsof -i :4000
kill <PID>
```

### Prisma migration fails with "P3009" or similar

The DB schema is out of sync. Run `npx prisma migrate reset` (dev only — drops
the DB) or `npx prisma db push` (when in dev).

### "Something went wrong" toast

Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R) and check the **DevTools
Network tab** for the failing request. The backend now returns a **specific
field-level error** like `description: Required` (in your language) instead
of a generic message.

### Frontend shows white screen

1. Open DevTools → Console
2. Look for the actual error (often a missing import, a TS error at build time)
3. Hard refresh
4. Check `npm run build` output for errors

### Toasts duplicate

Fixed in the latest build. Each error shows **exactly one** toast.

### Language not changing

1. Hard refresh
2. Open DevTools → Application → Local Storage → check `lsm_locale`
3. Try setting it manually and reloading

### Socket.IO not connecting

Check that your reverse proxy (nginx, Caddy) forwards the WebSocket upgrade
headers. Example nginx config:

```nginx
location /socket.io/ {
  proxy_pass http://127.0.0.1:4000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

---

## License

MIT
