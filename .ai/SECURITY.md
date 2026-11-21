# Security

## Authentication & Tokens (VERIFIED: `backend/src/config/env.ts`, `backend/src/utils/password.ts`, `backend/src/sockets/io.ts`)
- **Password Hashing**: `argon2` (`^0.40.3`).
- **JWT**: Access tokens default to `15m` (`JWT_ACCESS_TTL`), refresh tokens to `14d` (`JWT_REFRESH_TTL`).
- **Socket.IO Auth**: Handshake requires a valid access token in `auth.token` or `Authorization: Bearer ...`.
- **Client Token Storage**: Each frontend stores tokens under app-specific keys (`lsm_customer_access_token`, `lsm_worker_access_token`, `lsm_admin_access_token`) and sends `X-App-Origin`.

## Authorization & RBAC (VERIFIED: `backend/src/routes/admin.routes.ts`, `docs/PROJECT_KNOWLEDGE.md`)
- Roles (`CUSTOMER`, `WORKER`, `ADMIN`) are verified from the signed JWT, never from request bodies.
- Admin endpoints require both `ADMIN` JWT role and a database `Permission` (or wildcard `*`) checked via `requirePermission`.
- Worker quote creation requires `verificationStatus === APPROVED`.

## HTTP Hardening & Uploads (VERIFIED: `backend/src/app.ts`, `backend/src/config/env.ts`)
- `helmet` (with `crossOriginResourcePolicy: { policy: 'cross-origin' }`, `contentSecurityPolicy: false`).
- `cors` restricted to `env.corsOrigins`.
- `express-rate-limit` (`generalRateLimiter`) applied to `/api`.
- `express.json({ limit: '2mb' })`; file uploads capped at `MAX_UPLOAD_MB` (default `8` MB).
- **Never commit real secrets**: `docker-compose.yml` contains placeholder dev secrets (`change_me_jwt_secret_...`) that must be replaced in production.
