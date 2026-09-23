# Backend Agent Guide

Read `../docs/PROJECT_KNOWLEDGE.md` and the root `AGENTS.md` first.

- Keep route composition in `src/routes`, HTTP orchestration in `controllers`,
  rules/transactions in `services`, and request contracts in `validators`.
- Validate every external input with Zod and use `utils/api.ts` for responses.
- Update `src/swagger.ts` for every public API contract and preserve both API
  prefixes through the shared router registration.
- Prisma changes need a new non-destructive migration and `prisma generate`.
- Dynamic boost tiers live in `PlatformConfig.boostTiers`; public pricing and
  purchases must use the same configured tiers. Never reintroduce hard-coded
  tier data in an endpoint or service.
- Build with `npm run build`; for schema changes also run migration deployment.
