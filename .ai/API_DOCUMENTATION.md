# API Documentation

## Conventions (VERIFIED: `backend/src/app.ts`, `docs/PROJECT_KNOWLEDGE.md`)
- **Base Prefixes**:
  - Versioned (preferred): `/api/v1/{locale}/...` (`locale` in `en`, `zh`, `my`, `th`, `hi`)
  - Legacy: `/api/...` (locale from `Accept-Language`)
- **Response Envelope**:
  - Success: `{ success: true, data: ... }`
  - Error: `{ success: false, error: { code, message, details? } }`
- **OpenAPI / Swagger**: Served at `/api/docs` (`/api/docs.json`) and `/api/v1/:locale/docs(.json)` via `backend/src/swagger.ts`.
- **Health Check**: `GET /health` -> `{ success: true, data: { status: 'ok', env, time } }`.

## Mounted Route Groups (VERIFIED: `backend/src/app.ts`)
| Mount Path | Router File | Capabilities |
| --- | --- | --- |
| `/auth` | `auth.routes.ts` | Register, login, refresh, logout, reset password |
| `/users` | `user.routes.ts` | Current user profile, password change |
| `/categories`, `/services` | `category.routes.ts` | Public service categories and services |
| `/workers` | `worker.routes.ts` | Public search, recommendations, profile, KYC, services, availability, portfolio, status/location, favorites |
| `/requests` | `request.routes.ts` | Service request creation, detail, cancellation, worker feed |
| `/` (`quoteRouter`) | `quote.routes.ts` | `/requests/:id/quotes`, `/quotes/:id/...` |
| `/bookings` | `booking.routes.ts` | Customer/worker booking lists, status progression, cancellation, payment |
| `/` (`reviewRouter`) | `review.routes.ts` | `/bookings/:bookingId/review` |
| `/conversations`, `/messages` | `chat.routes.ts` | Conversations, messages, read state |
| `/notifications` | `notification.routes.ts` | User notifications |
| `/favorites` | `favorite.routes.ts` | Customer favorite workers |
| `/disputes` | `dispute.routes.ts` | Dispute creation and listing |
| `/files` | `file.routes.ts` | Authenticated multipart upload (`/files/upload`) |
| `/` (`boostRouter`) | `boost.routes.ts` | `/me/boost*`, `/pricing` |
| `/events` | `event.routes.ts` | Customer event tracking |
| `/` (`analyticsRouter`) | `analytics.routes.ts` | `/me/analytics` |
| `/admin` | `admin.routes.ts` | Analytics, accounts, KYC, catalog, RBAC, payments, reviews/disputes, config, audit, broadcasts |
