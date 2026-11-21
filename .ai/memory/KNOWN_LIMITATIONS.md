# Known Limitations & Technical Debt

## Confirmed Issues (VERIFIED)
- **Zero Automated Tests**: `vitest` is configured in `backend`, `customer-web`, and `worker-web`, but no `*.test.*` or `*.spec.*` files exist anywhere in the repo.
- **No CI/CD**: No `.github/workflows` or automated pipeline configuration exists.
- **Payment Gateway Stub**: Payments are marked `PAID` immediately for all accepted payment methods; no real payment gateway callback is implemented (`docs/PROJECT_KNOWLEDGE.md`).
- **Admin Web Tooling Gaps**: `admin-web/package.json` lacks `lint`, `format`, and `test` scripts, and uses `zod ^4.6.5` while the other apps use `zod ^3.23.8`.
- **Single Repository Class**: `backend/src/repositories/` only contains `file.repository.ts`; all other services call Prisma directly.

## Potential Risks (INFERRED)
- **Read-Access Authorization**: `bookingService.getById` and `requestService.getById` lack resource-ownership checks, which is an IDOR risk if not fixed.
- **Docker Compose Vite Env**: `VITE_*` variables in `docker-compose.yml` `environment:` will not affect already-built static nginx bundles unless passed as build args.
