# Coding Conventions

All conventions below are **VERIFIED** from `AGENTS.md`, `docs/PROJECT_KNOWLEDGE.md`, and source files:

1. **Backend Layering**:
   - Routes (`backend/src/routes/`): path registration, auth/permission guards, Zod validation.
   - Controllers (`backend/src/controllers/`): Express req/res orchestration only; return via `backend/src/utils/api.ts`.
   - Services (`backend/src/services/`): business rules, Prisma transactions, ownership checks, notifications, Socket.IO emission.
   - Validators (`backend/src/validators/`): Zod schemas for body, query, and params.
   - Repositories (`backend/src/repositories/`): persistence/infrastructure abstractions.
2. **Dual Routing & Swagger**: Every API route is mounted on both `/api/*` and `/api/v1/:locale/*` in `backend/src/app.ts`, and must be documented in `backend/src/swagger.ts`.
3. **Frontend Independence**: Never import code across `customer-web`, `worker-web`, and `admin-web`.
4. **Localization**: All user-facing text must be added to all 5 locale files (`en`, `zh`, `my`, `th`, `hi`) in each affected frontend.
5. **App-Origin Headers**: Preserve `X-App-Origin` values: `CUSTOMER_WEB`, `WORKER_WEB`, `ADMIN_WEB`.
6. **Code Style**: TypeScript strictness, ASCII by default, concise comments explaining *why*, no one-off error formats.
