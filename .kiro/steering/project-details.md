# Project Details

Reference details for Local Services Marketplace that go beyond `product.md`, `structure.md` and `tech.md`. The source code and `backend/prisma/schema.prisma` are the final authority. The OpenAPI document at `/api/docs` is the request/response reference. The full implementation map is `docs/PROJECT_KNOWLEDGE.md`.

## Running the Project

Full stack (Docker):

```bash
docker compose up --build -d
docker compose ps
docker compose exec -T backend npx prisma migrate deploy
docker compose exec -T backend npm run seed
```

| Service | URL |
| --- | --- |
| Customer | http://localhost:5173 |
| Worker | http://localhost:5174 |
| Admin | http://localhost:5176 |
| API | http://localhost:4000 (health: `/health`) |
| Swagger UI / JSON | http://localhost:4000/api/docs, `/api/docs.json` |
| PostgreSQL | localhost:5433 |

Without Docker: run PostgreSQL, then in `backend/` run `npm install`, `npx prisma migrate deploy`, `npm run seed`, `npm run build`, `node dist/server.js`. In each frontend run `npm install` and `npm run dev -- --host 0.0.0.0 --port <5173|5174|5176>`.

Demo logins (created by the seed, local development only):

| Role | Email |
| --- | --- |
| Admin | `admin@demo.com` |
| Customer | `customer@demo.com` |
| Worker | `plumber@demo.com`, `electrician@demo.com`, `cleaner@demo.com`, `mechanic@demo.com` |

Passwords are listed in the root `README.md`. Never reuse them outside local development.

## API Details

- Every router is mounted at `/api/v1/{locale}/...` (preferred) and `/api/...` (legacy, locale from `Accept-Language`). Locales: `en`, `zh`, `my`, `th`, `hi`.
- Success `{ success: true, data }`. Error `{ success: false, error: { code, message, details? } }`. Use `backend/src/utils/api.ts` and never invent another format.
- Middleware order in `app.ts`: `helmet`, `cors` (limited to `CORS_ORIGINS`), `express.json` (2mb), `morgan`, `detectOrigin`, `apiVersionRouter`, `generalRateLimiter`.
- Required request headers from browser clients: `Authorization: Bearer <access token>` and `X-App-Origin` (`CUSTOMER_WEB`, `WORKER_WEB`, `ADMIN_WEB`).
- Token refresh: on `401` each frontend queues in-flight requests, refreshes once with its own refresh token, then replays them. The refresh token hash is stored on `User.refreshTokenHash`, so a backend restart does not log users out.

| Mount path | Router file | Purpose |
| --- | --- | --- |
| `/auth` | `auth.routes.ts` | register, login, refresh, logout, reset password |
| `/users` | `user.routes.ts` | current profile, password change |
| `/categories`, `/services` | `category.routes.ts` | public catalog |
| `/workers` | `worker.routes.ts` | search, recommendations, profile, KYC, services, availability, portfolio, status/location |
| `/requests` | `request.routes.ts` | create, detail, cancel, worker feed |
| `/requests/:id/quotes`, `/quotes/:id` | `quote.routes.ts` | quote lifecycle |
| `/bookings` | `booking.routes.ts` | lists, status progression, cancel, pay |
| `/bookings/:bookingId/review` | `review.routes.ts` | one review per booking |
| `/conversations`, `/messages` | `chat.routes.ts` | chat and read state |
| `/notifications`, `/favorites`, `/events` | matching route files | notifications, favorites, customer event tracking |
| `/disputes` | `dispute.routes.ts` | one dispute per booking |
| `/files/upload` | `file.routes.ts` | authenticated multipart upload |
| `/me/boost*`, `/pricing` | `boost.routes.ts` | worker boost purchase, public pricing |
| `/me/analytics` | `analytics.routes.ts` | worker analytics |
| `/admin` | `admin.routes.ts` | analytics, accounts, KYC, catalog, RBAC, payments, review/dispute resolution, config, audit, broadcasts |

## Data Model

PostgreSQL 15 through Prisma (`backend/prisma/schema.prisma`, 8 migrations: `init`, `add_availability_slots`, `add_boost_and_events`, `add_event_source`, `add_admin_portal`, `add_is_banned`, `add_kyc_document_types`, `add_dynamic_boost_tiers`).

| Domain | Models |
| --- | --- |
| Identity | `User` (soft delete via `deletedAt`), `Address` |
| Worker supply | `WorkerProfile` (unique `userId`), `WorkerService`, `WorkerAvailability` (unique per day), `WorkingHours`, `WorkerDocument`, `KycDocument`, `PortfolioImage`, `Boost` |
| Catalog | `ServiceCategory`, `Service` (unique `slug`) |
| Marketplace | `ServiceRequest`, `RequestPhoto`, `Quote`, `Booking` (one per request and per quote) |
| Commerce and trust | `Payment`, `Review`, `Dispute` (each one per booking) |
| Communication | `Conversation` (unique customer + worker + optional request), `Message`, `Notification` |
| Growth | `Favorite`, `CustomerEvent` |
| Administration | `Permission`, `AdminRole`, `RolePermission`, `UserRole`, `AdminAuditLog`, `PlatformConfig` (singleton id `singleton`) |
| Files | `FileUpload` |

Enums: `Role`, `WorkerVerificationStatus`, `PricingType`, `RequestSchedule`, `RequestStatus`, `QuoteStatus`, `BookingStatus`, `PaymentMethod`, `PaymentStatus`, `NotificationType`, `DisputeStatus`, `DayOfWeek`, `KycDocumentType`, `KycStatus`. Use the Prisma enums and do not duplicate their strings.

## Realtime (Socket.IO)

- Server at `/socket.io` (`backend/src/sockets/io.ts`). Handshake needs a valid access token in `auth.token` or a Bearer header.
- Each connection joins `user:{userId}` and `app:{appOrigin}` rooms. Helpers: `emitToUser`, `emitToUsers`, `emitToApp`.
- Events: `request_received`, `quote_created`, `quote_accepted`, `quote_rejected`, `request_cancelled`, `booking_status_changed`, `payment_updated`, `new_message`, `message_read`, `notification_created`, `boost:activated`, `worker:status`.
- REST stays authoritative. Clients treat events as a cue to invalidate React Query keys, never as the only state update. `useSocket.ts` exists in customer-web and worker-web only.

## Security Model

- Passwords use argon2. Access tokens last 15 minutes, refresh tokens 14 days.
- Roles (`CUSTOMER`, `WORKER`, `ADMIN`) come from the verified JWT, never from a request body.
- Admin endpoints need the `ADMIN` role and a database permission (or `*`) through `requirePermission`.
- Frontend route guards (for example worker `requireApproved`) are UI conveniences. The backend checks are the real boundary.
- `helmet` is on (CSP disabled, cross-origin resource policy `cross-origin`). Uploads are limited by `MAX_UPLOAD_MB`.
- Secrets live in env or Docker secrets, never in code. The dev secrets in `docker-compose.yml` are placeholders to replace in production.

## Localization

Five locales (`en`, `zh`, `my`, `th`, `hi`) in `src/i18n/locales/*.json` of each frontend. Every new user-facing string needs all five entries in each app that renders it. Backend error messages are translated separately by the backend i18n middleware. Thai, Burmese and Hindi strings are longer, so check them in narrow layouts such as the bottom nav.

## Change Recipes

New API operation:
1. Zod contract in `backend/src/validators/`.
2. Ownership and business rules in the service.
3. Controller method using the shared response helpers.
4. Route with validation and auth guards.
5. Update `backend/src/swagger.ts` (both prefixes come from shared registration in `app.ts`).
6. Client endpoint functions, query invalidation, realtime wiring and all five translations in the affected frontend(s).

New persisted field or status:
1. Update `schema.prisma` and add a non-destructive migration (never edit an applied one).
2. Update seed data, validators, services, select/include shapes, admin views, client types, status labels, translations and Swagger.
3. Apply with `prisma migrate deploy`. Do not reset shared data.

UI change:
1. Follow the closest existing page and the app's `components/UI.tsx` primitives.
2. Follow the responsive rules in `tech.md` and check 375px, 768px and 1280px.
3. Add text to all five locales.

## Validation Checklist

```bash
npm --prefix backend run build
npm --prefix customer-web run build
npm --prefix worker-web run build
npm --prefix admin-web run build
curl http://localhost:4000/health
curl -I http://localhost:5173
curl -I http://localhost:5174
curl -I http://localhost:5176
curl http://localhost:4000/api/docs.json
```

## Known Caveats

1. `worker.routes.ts` registers `GET /:id` before `GET /me/profile`, so `GET /workers/me/profile` is matched as a profile lookup for id `me`.
2. `bookingService.getById` and `requestService.getById` are documented in `docs/PROJECT_KNOWLEDGE.md` as lacking participant checks. The root `README.md` describes contextual access control, so re-read the service code before relying on either description.
3. Payments are marked `PAID` immediately. There is no gateway callback.
4. `VITE_API_URL` and `VITE_SOCKET_URL` are passed as runtime env in Compose, but Vite reads them at build time.
5. Some admin route messages bypass the shared translated error helper.
6. `admin-web` has no `lint`, `format` or `test` scripts and uses zod 4 while the other apps use zod 3.
7. No automated tests and no CI pipeline exist.
