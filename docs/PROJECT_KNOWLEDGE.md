# Project Knowledge Base

This is the implementation-oriented guide to Local Services Marketplace. It is
intended for a coding agent or contributor who needs to make a safe change
without first rediscovering the system. The OpenAPI document at `/api/docs` is
the request/response reference; this guide explains ownership, workflows, and
the constraints that are easy to miss from an endpoint list.

## 1. System at a glance

The repository is a TypeScript monorepo with four independently deployable
applications:

| Component | Technology | Default port | Responsibility |
| --- | --- | ---: | --- |
| `backend` | Express, Prisma, Socket.IO | 4000 | API authority, auth, business rules, PostgreSQL access, uploads, realtime |
| `customer-web` | React 18, Vite, React Query, Tailwind | 5173 | Customer marketplace and booking experience |
| `worker-web` | React 18, Vite, React Query, Tailwind | 5174 | Worker onboarding, job execution, and earnings experience |
| `admin-web` | React 18, Vite, React Query, Tailwind | 5176 | Permission-controlled platform operations |

PostgreSQL 15 is the only required datastore and is exposed as host port 5433
when Docker Compose is used. Redis is optional: the backend attempts a lazy
connection only when `REDIS_URL` is configured. Files are stored under the
backend upload directory and served as `/uploads/*`.

The frontends do **not** share a package or UI library. Treat them as separate
applications that happen to consume the same API. Do not import from one web
app into another.

```text
customer-web ─┐
worker-web   ─┼─ REST + Socket.IO ─> backend ─> PostgreSQL
admin-web    ─┘                        └─────> local uploads (and optional Redis)
```

## 2. Source of truth and layering

Backend request flow is deliberately layered:

```text
route registration -> middleware -> controller -> service -> Prisma/repository -> response helper
```

- `backend/src/app.ts` mounts routers and global middleware. A route is exposed
  at both `/api/...` and `/api/v1/:locale/...`; do not change one without the
  other.
- `backend/src/routes/` is where route paths, auth/role/permission guards, and
  Zod validation are composed.
- `backend/src/controllers/` translates Express input to a service call and
  returns the standard response shape.
- `backend/src/services/` owns business rules, ownership checks, transactions,
  cross-entity updates, notifications, and socket emission.
- `backend/src/repositories/` is reserved for persistence/infrastructure
  abstractions; currently `file.repository.ts` is the only repository.
- `backend/src/validators/` defines request, query, and params contracts. New
  externally supplied values must be validated here before reaching services.
- `backend/src/utils/api.ts` is the canonical success/error response mechanism.
  Do not create one-off error formats.

The database schema in `backend/prisma/schema.prisma` is the authoritative
model definition. Prisma migrations are ordered historical changes; add a new
migration for persistent model changes and do not edit an applied migration.

## 3. API conventions

### Prefixes and localization

Every API router has two addresses:

| Form | Use |
| --- | --- |
| `/api/v1/{locale}/...` | Preferred, versioned and explicit locale |
| `/api/...` | Legacy compatibility form; locale comes from `Accept-Language` |

Supported locales are `en`, `zh`, `my`, `th`, and `hi`. UI-facing additions
need a translation in all five locale JSON files for each applicable frontend.

API results use `{ success: true, data: ... }`; errors use
`{ success: false, error: { code, message, details? } }`. Keep Swagger in
`backend/src/swagger.ts` synchronized whenever a path or public contract is
added or altered.

### Auth, client identity, and authorization

Access tokens last 15 minutes and refresh tokens 14 days by default. Their
TTLs, secrets, database connection, CORS, upload location, currency, and
commission defaults are centralized in `backend/src/config/env.ts`.

All three browser clients store separate access and refresh token keys and send
both `Authorization: Bearer ...` and their required `X-App-Origin` header:

| App | Header | Access-token storage key |
| --- | --- | --- |
| Customer | `CUSTOMER_WEB` | `lsm_customer_access_token` |
| Worker | `WORKER_WEB` | `lsm_worker_access_token` |
| Admin | `ADMIN_WEB` | `lsm_admin_access_token` |

The backend verifies roles from the JWT (`CUSTOMER`, `WORKER`, or `ADMIN`),
never from a client body. Admin actions require both the `ADMIN` JWT role and a
database permission (or wildcard `*`), via `requirePermission` in
`admin.routes.ts`. A normal `ADMIN` user without the matching `AdminRole` /
`RolePermission` assignment cannot perform the action.

### Route inventory

| Area | Mounted path | Main capabilities |
| --- | --- | --- |
| Auth | `/auth` | register, login, refresh, logout, reset password |
| Users | `/users` | current profile and password change |
| Catalog | `/categories`, `/services` | public categories/services |
| Workers | `/workers` | discovery, recommendations, profile, KYC, services, availability, portfolio, status/location, favorites |
| Requests and quotes | `/requests`, `/requests/:id/quotes`, `/quotes/:id` | demand creation/feed, quote lifecycle |
| Bookings | `/bookings` | customer/worker lists, lifecycle, cancellation, payment |
| Messaging | `/conversations`, `/messages` | conversations, messages, read state |
| Engagement | `/favorites`, `/notifications`, `/events`, `/me/analytics`, `/me/boost*`, `/pricing` | favorites, notifications, event tracking, worker analytics and boosts |
| Resolution | `/bookings/:bookingId/review`, `/disputes` | reviews and disputes |
| Files | `/files/upload` | authenticated multipart upload |
| Admin | `/admin` | analytics, accounts, KYC, catalog, RBAC, payments, review/dispute resolution, config, audit, broadcasts |

The exhaustive parameter and body reference is generated by Swagger. Generate
the matching Postman collection with `npm --prefix backend run postman`.

## 4. Core business lifecycles

### Customer request to paid job

```text
customer creates request
  -> FINDING_WORKERS
  -> matching service finds eligible nearby workers and emits request_received
worker creates quote
  -> request becomes QUOTES_RECEIVED
customer accepts one pending quote (transaction)
  -> accepted quote ACCEPTED; all others REJECTED
  -> request temporarily QUOTE_ACCEPTED, then BOOKING_CONFIRMED
  -> booking CONFIRMED
worker progresses the booking
  -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED
customer pays after COMPLETED
  -> Payment PAID
customer may create one review; either party may open one dispute
```

Important invariants enforced by services:

- A quote can only be made for a `FINDING_WORKERS` or `QUOTES_RECEIVED`
  request, by an approved worker who offers the request's service, with at most
  one quote per worker/request.
- Accepting a quote runs in a Prisma transaction. It creates exactly one
  booking (`requestId` and `quoteId` are unique) and snapshots monetary values.
- Booking transitions are limited to
  `CONFIRMED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED`; cancellation
  or dispute branches are narrower and terminal. Enforce changes through
  `bookingService.updateStatus`, not by writing the booking directly.
- Only the customer may cancel an eligible request/booking or pay. Payment is
  currently marked paid immediately for every accepted payment method; a real
  gateway callback has not been implemented.
- Review and dispute are each one-to-one with a booking. Completion increments
  the worker completed-jobs counter and clears live location.

### Worker discovery and eligibility

Worker search is public, while recommendations are customer-authenticated.
Request-feed matching requires the worker to have a profile, offer the same
service, have coordinates, and be within `serviceRadiusKm` according to the
Haversine distance calculation. Quote creation separately requires
`verificationStatus === APPROVED`.

Worker onboarding is not a cosmetic state: worker pages use `requireApproved`
for operational routes. Changes to worker eligibility must consider KYC,
verification status, offered services, location/radius, online/accepting-job
flags, and the worker-facing route guard together.

### Money, boosts, and analytics

Amounts are integer MMK values. On quote acceptance, `calculateMoney` applies
the configured platform commission and persists `subtotal`, `platformFee`,
`workerEarnings`, `total`, and the percentage used on the booking, preserving
the historical amount if configuration later changes.

Boosts make a worker temporarily rank higher in discovery; `Boost` records the
purchase and `WorkerProfile` carries the active lookup fields. Customer events
feed personalized worker recommendations and boost targeting. Do not change
event types or source values casually: they are the analytics vocabulary.

Boost tiers are dynamic configuration, not code constants. They are persisted
as `PlatformConfig.boostTiers`, edited in Admin through
`PATCH /api/admin/pricing/config`, read publicly through `GET /api/pricing`,
and validated again when a worker purchases `/api/me/boost`. The default tier
set is a compatibility fallback until an administrator saves a configuration.

## 5. Data model map

| Domain | Principal models | Notes |
| --- | --- | --- |
| Identity | `User`, `Address` | Soft deletion uses `deletedAt`; role is global account role |
| Worker supply | `WorkerProfile`, `WorkerService`, `WorkerAvailability`, `WorkingHours`, `WorkerDocument`, `KycDocument`, `PortfolioImage`, `Boost` | `WorkerProfile.userId` is unique; availability is unique per day |
| Catalog | `ServiceCategory`, `Service` | Slugs are unique and are public identifiers |
| Marketplace | `ServiceRequest`, `RequestPhoto`, `Quote`, `Booking` | One booking per request and quote; quotes carry the proposed amount |
| Commerce/trust | `Payment`, `Review`, `Dispute` | Each is one per booking |
| Communication | `Conversation`, `Message`, `Notification` | Conversation unique key is customer + worker + optional request ID |
| Growth | `Favorite`, `CustomerEvent` | Favorite unique per customer/worker profile pair |
| Administration | `Permission`, `AdminRole`, `RolePermission`, `UserRole`, `AdminAuditLog`, `PlatformConfig` | Platform config is the singleton ID `singleton` |
| File metadata | `FileUpload` | Uploaded content itself lives on storage/filesystem |

Use the enum definitions in the Prisma schema rather than duplicating strings.
Most terminal marketplace states are intentionally represented as enums, so a
new state normally requires changes to Prisma, validators, services, UI status
labels, translations, Swagger, and tests.

## 6. Realtime contract

Socket.IO runs on the backend HTTP server at `/socket.io`. The handshake needs
a valid access token in `auth.token` or a Bearer authorization header. Each
connection joins `user:{userId}` and `app:{appOrigin}` rooms.

Server-emitted events used by the applications include:

- `request_received`, `quote_created`, `quote_accepted`, `quote_rejected`,
  `request_cancelled`
- `booking_status_changed`, `payment_updated`
- `new_message`, `message_read`, `notification_created`
- `boost:activated`, `worker:status`

REST remains authoritative. Socket events should cause cache invalidation or a
safe UI refresh; do not rely on an event as the sole persisted state update.
When adding a meaningful asynchronous state change, emit an event from the
service after persistence and wire both relevant web clients if they display it.

## 7. Frontend ownership

Each frontend follows the same broad internal vocabulary, but remains local:

- `src/app/AppProviders.tsx`: provider composition (React Query, i18n, auth,
  toast and validation translation boundaries).
- `src/api/client.ts`: Axios setup, identity header, locale header and refresh
  queue. Preserve its app-specific token keys and `X-App-Origin` value.
- `src/api/endpoints.ts`: endpoint calls and response mapping.
- `src/contexts/AuthContext.tsx`: session ownership.
- `src/layouts/`: app chrome plus route outlet.
- `src/pages/`: route-level use cases; `src/components/` contains UI pieces;
  `src/hooks/` contains reusable client behavior.

### Routes by audience

| Customer | Worker | Admin |
| --- | --- | --- |
| `/`, `/services`, `/workers/:id` public discovery | `/login`, `/register`, `/onboarding` | `/login` |
| authenticated: create/request detail, bookings, messages, favorites, notifications, profile, settings | approved operations: dashboard, boost, analytics, requests/detail, jobs/detail, calendar, earnings, services, availability, messages; profile/settings/notifications require login | authenticated: dashboard, users, workers, KYC, bookings, categories, boost tiers, payments, analytics, config, roles, audit, reviews, disputes, notifications, broadcast |

The worker client's `requireApproved` guard is a UI convenience, not an API
security boundary. The backend's role/verification checks remain mandatory.

## 8. Change recipes

### New API operation

1. Add a Zod contract in `backend/src/validators/`.
2. Implement ownership and business rules in the relevant service.
3. Add the controller method using shared response helpers.
4. Register the route with validation and authentication/authorization.
5. Update `backend/src/swagger.ts`; both API prefixes gain the route through
   the shared registration in `app.ts`.
6. Add client endpoint functions only in the affected frontend(s), then query
   invalidation/realtime behavior and all five translations.
7. Add focused tests, build all affected packages, and verify Swagger.

### New persisted field or status

1. Update `schema.prisma` and create a non-destructive Prisma migration.
2. Update seed data if the field is required or demo behavior relies on it.
3. Update validators, services, select/include shapes, admin views, client
   types, format/status helpers, all translations, Swagger, and tests.
4. Apply migrations with `prisma migrate deploy`; never reset shared data as a
   shortcut.

### New user-facing copy

Update `en`, `zh`, `my`, `th`, and `hi` locale JSON files in every frontend
that renders it. Backend error messages are localized separately through the
backend i18n middleware.

## 9. Operational procedures

Start the complete stack with:

```bash
docker compose up --build -d
docker compose ps
curl http://localhost:4000/health
curl -I http://localhost:5173
curl -I http://localhost:5174
curl -I http://localhost:5176
curl http://localhost:4000/api/docs.json
```

For a focused change, build only the impacted package first, then perform the
broader checks before handoff:

```bash
npm --prefix backend run build
npm --prefix customer-web run build
npm --prefix worker-web run build
npm --prefix admin-web run build
```

For schema work, deploy then seed only when the requested environment permits
it:

```bash
docker compose exec -T backend npx prisma migrate deploy
docker compose exec -T backend npm run seed
```

Demo credentials and full local startup instructions are in the root README.
Node 20 or newer is required by the backend.

## 10. Known implementation caveats to preserve or deliberately fix

These are observations from the current source, not desired future behavior:

1. `worker.routes.ts` registers `GET /:id` before `GET /me/profile`. Therefore
   a GET for `/workers/me/profile` is matched as a public-profile lookup for
   ID `me`; move the static `/me/*` GET routes above `/:id` when fixing this.
   The write-only `/me/*` routes are not affected because the methods differ.
2. `bookingService.getById` fetches a booking without checking whether the
   authenticated caller is its customer, worker, or an admin. Routes enforce
   authentication but not resource ownership for that read. Preserve this only
   for compatibility; treat an ownership guard as a security fix, not a UI
   change.
3. `requestService.getById` likewise returns a request after lookup without an
   access check. Its route requires authentication, but the service does not
   constrain customer/worker participation.
4. Compose supplies `VITE_*` variables in service runtime environments. Vite
   normally substitutes these at build time, so production deployment should
   ensure API and socket URLs are present during image build or use an explicit
   runtime configuration strategy.
5. User-provided textual admin response messages inside `admin.routes.ts`
   bypass the shared translated error helper. New public errors should use the
   existing API error utilities.

Treat the caveats as a review checklist. Do not silently change public behavior
while doing an unrelated feature; if you address one, update tests, Swagger
where relevant, and this document.

## 11. Agent working agreement

Before editing, inspect the nearest existing route/service/page pattern and
check `git status` so unrelated user changes are untouched. Keep changes
vertical and small: an API feature normally touches one validator, service,
controller, route, Swagger definition, and the specific client(s) consuming it.

Never trust role or ownership supplied by the browser. Never omit validation.
Never add a UI label in only one locale. Never alter legacy/versioned routing
or the fixed app-origin identifiers as incidental cleanup. Update the root
README when deployment behavior, ports, routes, environment variables, or
commands change.
