# Product Memory

## Target Users

1. **Customers** (`CUSTOMER` role, `customer-web`): Browse services/workers, post service requests, compare/accept quotes, track bookings, pay, chat, review, and open disputes. (VERIFIED: `customer-web/src/App.tsx`, `backend/prisma/schema.prisma`)
2. **Workers** (`WORKER` role, `worker-web`): Onboard with KYC documents, configure offered services/availability/radius, receive matched requests, submit quotes, execute jobs, track earnings, and purchase visibility boosts. (VERIFIED: `worker-web/src/App.tsx`, `docs/PROJECT_KNOWLEDGE.md`)
3. **Administrators** (`ADMIN` role + DB `Permission`, `admin-web`): Manage users/workers, approve/reject KYC, manage service categories/services, configure platform commission & boost tiers, resolve disputes, moderate reviews, and view audit logs/analytics. (VERIFIED: `admin-web/src/App.tsx`, `backend/src/routes/admin.routes.ts`)

## Core Business Workflows

### 1. Request-to-Paid-Job Lifecycle (VERIFIED: `docs/PROJECT_KNOWLEDGE.md`, `backend/prisma/schema.prisma`)
1. Customer creates a `ServiceRequest` -> status `FINDING_WORKERS`.
2. `matching.service.ts` finds eligible nearby workers (matching service, coordinates within `serviceRadiusKm` via Haversine) and emits `request_received` via Socket.IO.
3. Approved worker submits a `Quote` -> request status becomes `QUOTES_RECEIVED`.
4. Customer accepts one pending quote inside a Prisma transaction -> accepted quote `ACCEPTED`, other quotes `REJECTED`, request becomes `BOOKING_CONFIRMED`, and one `Booking` is created with `CONFIRMED` status and snapshotted monetary values.
5. Worker progresses booking: `CONFIRMED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED`.
6. Customer pays after `COMPLETED` -> `Payment` marked `PAID` immediately (no external payment gateway callback implemented yet).
7. Customer may submit one `Review`; either party may open one `Dispute`.

### 2. Worker Onboarding & Eligibility (VERIFIED: `docs/PROJECT_KNOWLEDGE.md`)
- Worker pages in `worker-web` use `requireApproved` for operational routes (UI convenience).
- Backend enforces `verificationStatus === APPROVED` for quote creation.
- Eligibility for request matching requires: `WorkerProfile`, offered `WorkerService`, coordinates, and distance within `serviceRadiusKm`.

### 3. Currency, Commission & Boosts (VERIFIED: `docs/PROJECT_KNOWLEDGE.md`, `backend/src/config/env.ts`)
- Amounts are integer **MMK** values (`DEFAULT_CURRENCY=MMK`).
- Default platform commission is `10%` (`PLATFORM_COMMISSION_PERCENT=10`), snapshotted on booking creation.
- Boost tiers are stored dynamically in `PlatformConfig.boostTiers` (editable via Admin `PATCH /api/admin/pricing/config`, readable via `GET /api/pricing`).
