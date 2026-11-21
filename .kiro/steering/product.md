# Product Overview

Local Services Marketplace (`on-demand-app`) is an on-demand marketplace for local services (home repair, cleaning, plumbing, electrical and similar). It connects **Customers** who need work done with **Workers** who quote and perform it, and gives **Platform Administrators** the tools to operate the marketplace. The default currency is integer **MMK** (Myanmar Kyat) and the UI is localized in five languages: `en`, `zh`, `my`, `th`, `hi`.

## Audiences and Applications

| Audience | App | Port | What they do |
| --- | --- | ---: | --- |
| Customers (`CUSTOMER` role) | `customer-web` | 5173 | Discover services and workers, create service requests, compare and accept quotes, track bookings, pay, chat, review, favorite workers, open disputes |
| Workers (`WORKER` role) | `worker-web` | 5174 | Register and complete KYC onboarding, configure offered services, availability and service radius, receive matched requests, submit quotes, run jobs, track earnings and analytics, buy visibility boosts |
| Administrators (`ADMIN` role plus database permissions) | `admin-web` | 5176 | Manage users and workers, review KYC, manage the service catalog, RBAC roles and permissions, resolve disputes, moderate reviews, view payments, analytics and audit log, edit platform config, send broadcasts |

All three apps use the same backend API (port 4000). The apps do not share code.

## Core Workflow: Request to Paid Job

1. Customer creates a `ServiceRequest`. Status becomes `FINDING_WORKERS`.
2. The matching service finds eligible nearby workers and emits `request_received` over Socket.IO.
3. An approved worker submits a `Quote`. Request status becomes `QUOTES_RECEIVED`.
4. Customer accepts one pending quote. In one transaction the accepted quote becomes `ACCEPTED`, all other quotes `REJECTED`, the request `BOOKING_CONFIRMED`, and a `Booking` is created as `CONFIRMED` with monetary values snapshotted.
5. Worker progresses the booking: `CONFIRMED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED`.
6. Customer pays after `COMPLETED`. The `Payment` is marked `PAID` immediately (no real payment gateway yet).
7. Customer may leave one `Review`. Either party may open one `Dispute`.

## Business Rules to Preserve

- **Worker eligibility for matching:** the worker has a `WorkerProfile`, offers the requested service, has coordinates, and is within `serviceRadiusKm` (Haversine distance).
- **Worker eligibility to quote:** `verificationStatus` must be `APPROVED` (enforced by the backend, not just the UI guard).
- **Quotes:** only on `FINDING_WORKERS` or `QUOTES_RECEIVED` requests, at most one quote per worker per request.
- **Money:** amounts are integer MMK. Default platform commission is 10% (`PLATFORM_COMMISSION_PERCENT`). `subtotal`, `platformFee`, `workerEarnings`, `total` and the commission percentage are snapshotted on the booking, so later config changes never alter history.
- **Boosts:** paid, time-limited ranking boost for a worker in discovery. Tiers are dynamic data in `PlatformConfig.boostTiers`, edited by admins (`PATCH /api/admin/pricing/config`), publicly readable at `GET /api/pricing`, and re-validated on purchase (`/api/me/boost`).
- **Review and dispute:** each is one-to-one with a booking.
- **Recommendations:** customer events (`CustomerEvent`) feed personalized worker recommendations. Treat event types and source values as an analytics vocabulary and do not rename them casually.
- **Admin access:** an admin action needs both the `ADMIN` JWT role and a matching database permission (or wildcard `*`).

## Feature Areas by App

**customer-web:** public home, service search and worker profiles; authenticated request creation and detail, quote comparison, bookings and booking detail, payment, review, messages, favorites, notifications, profile and settings.

**worker-web:** login, register, onboarding with KYC documents; approved-only dashboard, requests feed and detail, quoting, jobs and job detail, calendar, availability, services, earnings, analytics, boost purchase, messages; profile, settings, notifications.

**admin-web:** dashboard, users and user detail, workers and worker detail, KYC list and detail, bookings and booking detail, categories, boost tiers, payments, reviews, disputes, analytics, config, roles, audit log, broadcast, notifications.

## Realtime Experience

Customers and workers get live updates (new requests, quotes, booking status, chat messages, notifications, boost activation, worker status) through Socket.IO. REST is the source of truth; events trigger a refresh. The admin portal does not use sockets.

## Known Product Gaps

- Payments are a stub: every accepted method is marked `PAID` immediately.
- There are no automated tests and no CI pipeline.
- `bookingService.getById` and `requestService.getById` do not check that the caller is a participant (an authorization gap to treat as a security fix).
