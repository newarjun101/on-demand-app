# Module Map

## Backend (`backend/src/`)
- **Entry Points**: `server.ts` (HTTP + Socket.IO startup), `app.ts` (`buildApp()`, middleware, dual-prefix router mounting). (VERIFIED)
- **Config (`config/`)**: `env.ts` (centralized env vars), `prisma.ts` (Prisma client), `redis.ts` (optional lazy Redis client). (VERIFIED)
- **Middleware (`middleware/`)**: `auth.ts` (`detectOrigin`, JWT auth, role/permission guards), `i18n.ts` (`apiVersionRouter`, `notFoundHandler`, `errorHandler`), `rateLimit.ts` (`generalRateLimiter`), `upload.ts` (Multer), `validate.ts` (Zod validation). (VERIFIED)
- **Routes (`routes/`)**: 17 route files (`admin`, `analytics`, `auth`, `booking`, `boost`, `category`, `chat`, `dispute`, `event`, `favorite`, `file`, `notification`, `quote`, `request`, `review`, `user`, `worker`). (VERIFIED)
- **Controllers (`controllers/`)**: 17 controllers translating Express requests to service calls and returning `utils/api.ts` responses. (VERIFIED)
- **Services (`services/`)**: 19 services owning business rules, transactions, notifications, and Socket.IO emissions (includes `matching.service.ts` in addition to the 17 route domains). (VERIFIED)
- **Repositories (`repositories/`)**: `file.repository.ts` (only repository currently). (VERIFIED)
- **Validators (`validators/`)**: 10 Zod schema modules (`analytics`, `auth`, `booking`, `boost`, `message`, `quote`, `request`, `review`, `user`, `worker`). (VERIFIED)
- **Sockets (`sockets/io.ts`)**: `initSockets`, `emitToUser`, `emitToUsers`, `emitToApp`. (VERIFIED)
- **Docs & Scripts**: `swagger.ts` (OpenAPI spec), `scripts/postman.ts` (Postman collection generator). (VERIFIED)

## Frontends (`customer-web/`, `worker-web/`, `admin-web/`)
Each frontend is self-contained with:
- `src/main.tsx` -> `src/App.tsx` (routes) + `src/app/AppProviders.tsx` (React Query, i18n, auth, toast).
- `src/api/client.ts` (Axios + `X-App-Origin` + refresh token queue) and `src/api/endpoints.ts`.
- `src/contexts/AuthContext.tsx` (session state).
- `src/i18n/locales/{en,zh,my,th,hi}.json`.
- `src/pages/` & `src/components/` & `src/layouts/`.
- `customer-web` & `worker-web` also have `src/services/socket.ts` and `src/hooks/useSocket.ts`. (VERIFIED)
