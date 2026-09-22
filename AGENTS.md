# Repository Agent Guide

## Project

Local Services Marketplace is a TypeScript monorepo with one shared backend and three independent React/Vite frontends:

- `backend/`: Express, Prisma, PostgreSQL, Socket.IO, and localized OpenAPI documentation
- `customer-web/`: customer experience on port `5173`
- `worker-web/`: worker experience on port `5174`
- `admin-web/`: administration portal on port `5176`

The backend runs on port `4000`. Docker Compose also exposes PostgreSQL on host port `5433`.

## Architecture Rules

- Keep HTTP transport concerns in `backend/src/routes/` and business rules in `backend/src/services/`.
- Keep persistence and infrastructure concerns in `backend/src/repositories/` and `backend/src/config/`.
- Validate request bodies, query strings, and route parameters with Zod before calling services.
- Return API responses through the shared helpers in `backend/src/utils/api.ts`.
- Keep authentication and permission checks in middleware or service boundaries; never trust a role supplied by a client.
- Keep Swagger/OpenAPI definitions synchronized with every mounted route, including both legacy `/api/*` and versioned `/api/v1/{locale}/*` paths.
- Keep each frontend independent. Shared behavior within a frontend belongs in `src/app/`, `src/api/`, `src/contexts/`, `src/components/`, `src/hooks/`, `src/layouts/`, `src/pages/`, and `src/utils/`.
- Use the existing `AppProviders` boundary for frontend providers such as React Query, i18n, auth, validation translation, and toasts.
- Preserve the `X-App-Origin` values: `CUSTOMER_WEB`, `WORKER_WEB`, and `ADMIN_WEB`.
- Add user-facing text to all five locale files: `en`, `zh`, `my`, `th`, and `hi`.

## Development

Start the complete stack:

```bash
docker compose up --build -d
```

Local URLs:

- Customer: `http://localhost:5173`
- Worker: `http://localhost:5174`
- Admin: `http://localhost:5176`
- API: `http://localhost:4000`
- Swagger UI: `http://localhost:4000/api/docs`

Demo accounts are documented in `README.md`.

## Validation

Run the narrowest relevant check after each edit, then the broader check before finishing:

```bash
npm --prefix backend run build
npm --prefix customer-web run build
npm --prefix worker-web run build
npm --prefix admin-web run build
docker compose up --build -d
docker compose ps
curl http://localhost:4000/health
curl -I http://localhost:5173
curl -I http://localhost:5174
curl -I http://localhost:5176
curl http://localhost:4000/api/docs.json
```

For database changes:

```bash
docker compose exec -T backend npx prisma migrate deploy
docker compose exec -T backend npm run seed
```

Do not use destructive database commands unless explicitly requested. Do not reset or discard unrelated user changes.

## Documentation

Update `README.md` when ports, services, environment variables, routes, build commands, or deployment behavior changes. Update `backend/src/swagger.ts` when an API route or request contract changes. Keep frontend-local READMEs aligned with the root documentation.

## Editing Standards

- Make the smallest focused change that fixes the behavior.
- Preserve public routes and API contracts unless the task explicitly changes them.
- Prefer existing local patterns over new abstractions.
- Do not add secrets, generated credentials, or license headers.
- Use ASCII by default and keep comments short and explanatory.
- Never commit changes or create branches unless explicitly requested.
