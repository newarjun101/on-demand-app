# Backend — Local Services Marketplace

See the [main README](../../README.md) for the full project documentation.

This README only covers backend-specific topics.

## Quick start

```bash
cp .env.example .env         # set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npx prisma migrate dev      # create + apply migrations
npm run seed                # seed demo data
npm run dev                 # start dev server on port 4000
```

## Scripts

| Command                              | What it does                                |
|--------------------------------------|---------------------------------------------|
| `npm run dev`                        | Dev server with auto-reload (tsx watch)      |
| `npm run build`                      | TypeScript compile to `dist/`                |
| `npm start`                          | Run production build                         |
| `npx prisma migrate dev --name X`    | Create a new migration                       |
| `npx prisma migrate deploy`          | Apply migrations to production DB            |
| `npm run seed`                       | Populate demo categories, workers, customers|
| `npx prisma studio`                  | Open Prisma DB browser                       |
| `npx tsx src/scripts/postman.ts en`   | Regenerate `postman-collection.json`         |

## API documentation

When the server is running:

- **Swagger UI**: http://localhost:4000/api/docs
  - Localized: `http://localhost:4000/api/v1/{en,zh,my,th,hi}/docs`
- **OpenAPI JSON**: http://localhost:4000/api/docs.json
- **Postman collection**: `postman-collection.json` (regenerate with `npx tsx src/scripts/postman.ts en`)

The OpenAPI spec covers **58 endpoints** across 16 resource groups (Auth, Users,
Workers, Services, Requests, Quotes, Bookings, Chat, Favorites, Notifications,
Reviews, Files, Boost, Analytics, Events, Disputes, Health).

## Dynamic boost tiers

Boost tiers are stored in `PlatformConfig.boostTiers` and managed through the
Admin portal. `GET /api/pricing` returns the active tier collection; workers
must submit a duration and amount matching one of those tiers when calling
`POST /api/me/boost`. The fallback tiers are used only until an administrator
saves the first configuration. Apply migration
`20260924090000_add_dynamic_boost_tiers` before deploying this feature.

## Environment variables

See `.env.example` for the full list. The most important:

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — at least 32 chars each
- `CUSTOMER_WEB_URL` and `WORKER_WEB_URL` — for CORS
- `CORS_ORIGINS` — comma-separated list of allowed origins
- `UPLOAD_DIR` — where uploaded files are stored (default `./uploads`)
- `PLATFORM_COMMISSION_PERCENT` — 0–50, default 10

## Architecture (backend)

```
src/
├── config/                # env loader + Prisma client
├── middleware/            # auth, rate limit, i18n (localized errors), upload
├── routes/                # Express routers — one per resource
├── services/              # Business logic — one per resource
├── sockets/               # Socket.IO server
├── swagger.ts             # OpenAPI 3.0 spec generator (i18n-aware)
├── scripts/postman.ts     # Postman collection generator
└── server.ts              # entry point
```

### Adding a new endpoint

1. Add the route in `src/routes/your-resource.routes.ts`
2. Add a request schema in `src/validators/your-resource.ts` (use the helpers
   from `zod-helpers.ts` for clean error messages)
3. Add the business logic in `src/services/your-resource.service.ts`
4. Add an entry to the `ROUTES` table in `src/swagger.ts` so the new endpoint
   shows up in Swagger and the Postman collection
5. Regenerate the Postman collection: `npx tsx src/scripts/postman.ts en`

### Localized error messages

Add a new error code in `src/middleware/i18n.ts`:

```ts
BAD_REQUEST: { en: 'Bad request', zh: '请求错误', my: '...', th: '...', hi: '...' },
```

Then throw `errors.badRequest('Bad request')` in your service. The error
handler will automatically pick the right language based on the
`Accept-Language` header or the URL path locale.

### i18n for the OpenAPI spec

`src/swagger.ts` uses the same translation table. To add a new route group
tag, add a new entry to `UI_STRINGS` and reference it in the `tags` array of
`buildSpec()`.

## Database

The Prisma schema defines 20+ models. See `prisma/schema.prisma` for the full
list. Important indexes:

- `User(role)` — fast role-based queries
- `WorkerProfile(verificationStatus, isBoosted, boostExpiresAt)` — fast
  boosted-worker queries
- `CustomerEvent(workerId, createdAt)` — analytics queries
- `CustomerEvent(userId, createdAt)` — recommendation engine
- `Quote(requestId, status)` — quote aggregation
- `ServiceRequest(status, deletedAt)` — request feeds

## WebSocket (Socket.IO)

Connected to the same HTTP server. Authenticated via the JWT in the
`auth.token` handshake field. Users join a personal room `user:{userId}` and
can also join app rooms `app:CUSTOMER_WEB` / `app:WORKER_WEB`.

To add a new event:
1. In the service, call `emitToUser(userId, 'event_name', payload)` from
   `src/sockets/io.ts`
2. In the frontend, listen with `useSocketEvent('event_name', (data) => ...)`
   from `src/hooks/useSocket.ts`

## Testing

The project is verified end-to-end with a manual test script. See the
"Testing" section of the main README.

For automated tests in the future, use:
- **Vitest** for unit tests (already configured in package.json)
- **Supertest** for HTTP integration tests
- **Playwright** for end-to-end browser tests

## License

MIT
