# Data Flow

## REST Request Flow (Backend)
1. Client sends HTTP request to `/api/v1/:locale/...` (or `/api/...`) with `Authorization: Bearer <token>` and `X-App-Origin` (`CUSTOMER_WEB` | `WORKER_WEB` | `ADMIN_WEB`).
2. `app.ts` applies `helmet`, `cors`, `express.json` (2mb limit), `morgan`, `detectOrigin()`, `apiVersionRouter` (strips `/v1/:locale` and sets locale), and `generalRateLimiter`.
3. Route middleware runs JWT auth, role/permission checks, and Zod validation (`validate.ts`).
4. Controller delegates to Service.
5. Service executes business logic, Prisma queries/transactions, optional notifications, and Socket.IO emissions.
6. Controller returns standardized `{ success: true, data }` (or `errorHandler` returns `{ success: false, error: { code, message, details? } }`). (VERIFIED: `backend/src/app.ts`, `docs/PROJECT_KNOWLEDGE.md`)

## Frontend Data & Auth Flow
1. `AppProviders.tsx` wraps the app in React Query, i18n, `AuthContext`, and toast providers.
2. `src/api/client.ts` attaches `Authorization` and `X-App-Origin` headers. On `401`, it queues concurrent requests and refreshes the access token using the app-specific refresh token.
3. React Query manages server state, caching, and invalidation.
4. In `customer-web` and `worker-web`, `useSocket.ts` listens for Socket.IO events (`request_received`, `quote_created`, `quote_accepted`, `booking_status_changed`, `new_message`, `notification_created`, etc.) and invalidates relevant React Query keys. (VERIFIED: `docs/PROJECT_KNOWLEDGE.md`, `customer-web/src/`, `worker-web/src/`)
