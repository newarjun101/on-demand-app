# Build and Deployment

## Prerequisites (VERIFIED: `backend/package.json`, `docker-compose.yml`)
- Node.js `>=20.0.0`
- Docker & Docker Compose (for full-stack containerized run)

## Full Stack via Docker Compose (VERIFIED: `docker-compose.yml`)
```bash
docker compose up --build -d
docker compose ps
```
Services & Ports:
- `postgres`: `5433:5432` (`postgres:15-alpine`)
- `backend`: `4000:4000` (`http://localhost:4000/health`, `/api/docs`)
- `customer-web`: `5173:80`
- `worker-web`: `5174:80`
- `admin-web`: `5176:80`

## Database Migrations & Seeding (VERIFIED: `AGENTS.md`, `backend/package.json`)
```bash
docker compose exec -T backend npx prisma migrate deploy
docker compose exec -T backend npm run seed
```

## Individual Builds (VERIFIED: `package.json` scripts)
```bash
npm --prefix backend run build
npm --prefix customer-web run build
npm --prefix worker-web run build
npm --prefix admin-web run build
```

## Testing & Linting Status (VERIFIED)
- `vitest` is configured in `backend`, `customer-web`, and `worker-web`, **but 0 test files exist**.
- `admin-web` has no `lint`, `format`, or `test` scripts in `package.json`.
- No `.github/workflows` CI/CD pipelines exist.
