# Tech Stack

Versions are taken from the `package.json` files and `docker-compose.yml`.

## Backend (`backend/`)

| Concern | Choice |
| --- | --- |
| Runtime and language | Node.js `>=20`, TypeScript `^5.5`, `tsx` for dev |
| Web framework | Express `^4.19` |
| Database and ORM | PostgreSQL 15 (`postgres:15-alpine`), Prisma `^5.20` |
| Realtime | Socket.IO `^4.7` at `/socket.io` |
| Cache (optional) | `ioredis`, connects lazily only when `REDIS_URL` is set |
| Auth and security | `jsonwebtoken` (access 15m, refresh 14d), `argon2`, `helmet`, `cors`, `express-rate-limit` |
| Validation and docs | `zod ^3.23`, `swagger-ui-express` (UI at `/api/docs`, JSON at `/api/docs.json`) |
| Uploads | `multer`, files under the upload dir, served at `/uploads/*`, limit `MAX_UPLOAD_MB` (default 8) |
| Tooling | `vitest`, `eslint`, `prettier` |

API conventions: success `{ success: true, data }`, error `{ success: false, error: { code, message, details? } }` via `utils/api.ts`. JSON body limit 2mb. Locales `en`, `zh`, `my`, `th`, `hi`. Roles come from the signed JWT, never from client input.

Key env vars (all read in `backend/src/config/env.ts`): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL` (15m), `JWT_REFRESH_TTL` (14d), `CORS_ORIGINS` (defaults from `CUSTOMER_WEB_URL` and `WORKER_WEB_URL`), `UPLOAD_DIR`, `MAX_UPLOAD_MB` (8), `PLATFORM_COMMISSION_PERCENT` (10), `DEFAULT_CURRENCY` (MMK), optional `REDIS_URL`. `docker-compose.yml` ships placeholder dev secrets that must be replaced in production.

## Frontends (`customer-web`, `worker-web`, `admin-web`)

| Concern | Choice |
| --- | --- |
| Core | React `^18.3`, TypeScript `^5.5`, Vite `^5.4` |
| Routing and data | `react-router-dom ^6.26`, `@tanstack/react-query ^5.59`, `axios ^1.7` |
| Styling and UI | Tailwind CSS `^3.4`, `lucide-react`, `react-hot-toast`, `clsx` |
| Forms | `react-hook-form` with `@hookform/resolvers` and `zod` (customer and worker: zod 3, resolvers 3.x; admin: zod 4, resolvers 5.x) |
| Realtime | `socket.io-client` in customer-web and worker-web only |
| i18n | In-repo provider in `src/i18n/` with 5 JSON locales |
| Path alias | `@/` maps to `src/` |
| Tests | `vitest` configured in customer-web and worker-web, admin-web has none |

Build per app: `tsc -b && vite build`. Containers serve the static build with nginx on port 80.

## Infrastructure

- Docker Compose: `postgres` (host 5433), `backend` (4000), `customer-web` (5173), `worker-web` (5174), `admin-web` (5176).
- `VITE_API_URL` and `VITE_SOCKET_URL` are build-time values in Vite. Passing them only as runtime `environment:` in Compose does not change an already built bundle.

## Commands

```bash
docker compose up --build -d          # full stack
docker compose ps
npm --prefix backend run build
npm --prefix customer-web run build
npm --prefix worker-web run build
npm --prefix admin-web run build
docker compose exec -T backend npx prisma migrate deploy
docker compose exec -T backend npm run seed
npm --prefix backend run postman       # regenerate Postman collection
curl http://localhost:4000/health
```

Do not run destructive database commands unless explicitly asked.

## Engineering Rules

- TypeScript strict, ASCII by default, short comments that explain why.
- Validate every external input with Zod before it reaches a service.
- Keep `backend/src/swagger.ts` in sync with every route on both prefixes.
- Preserve `X-App-Origin` values and app-specific token keys.
- Prefer the smallest change that fixes the behavior and follow the nearest existing pattern.
- Do not commit or create branches unless asked (the repo guide in `AGENTS.md`).

## Testing and CI Status

No `*.test.*` or `*.spec.*` files exist and there is no `.github/workflows` pipeline. Add tests only when requested.

## Responsive Design Conventions

All three frontends are mobile-first Tailwind apps. Target widths: phone (~375px), tablet (~768px), desktop (1280px+).

- Use unprefixed classes for phones and add `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px) overrides upward.
- Page header rows (title plus actions) use `flex flex-wrap items-center justify-between gap-3` so actions wrap on narrow screens.
- Grids must start from a small column count (`grid-cols-1` or `grid-cols-2`) and increase with breakpoints.
- Wrap wide tables in `overflow-x-auto` (or put the class on the `Card`).
- Modals (`fixed inset-0`) use `p-4 sm:p-6` and `max-h-[90vh] overflow-y-auto` so tall content scrolls on short screens.
- `admin-web` sidebar is an off-canvas drawer below `lg` (hamburger in the header) and a collapsible static sidebar from `lg` up. `customer-web` uses a bottom nav below `md`.
- Keep touch targets at least 40px tall on phones and keep the viewport meta tag in each `index.html`.
- Check layouts at 375px, 768px, and 1280px before finishing a UI change.
- Fixed bottom navs use `pb-[max(0.5rem,env(safe-area-inset-bottom))]`, and the page `<main>` reserves `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0` so content is not covered. Each `index.html` sets `viewport-fit=cover`.
- Form fields are 16px on phones (rule in each `index.css`) to stop iOS Safari zooming on focus.
- Never hide an action on phones without a replacement. The worker online/offline toggle is icon-only below `sm`.
