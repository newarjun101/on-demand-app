# Project Context

## Overview

**Local Services Marketplace** (`on-demand-app`) is a full-stack TypeScript monorepo implementing an on-demand local services marketplace (e.g., home repair, cleaning, plumbing, electrical) with real-time matching, quoting, booking lifecycle, in-app chat, reviews, disputes, worker boosts, and an RBAC-controlled admin portal. (VERIFIED: `AGENTS.md`, `docs/PROJECT_KNOWLEDGE.md`, `backend/prisma/schema.prisma`)

## Monorepo Structure

The repository contains four independently deployable applications (VERIFIED: `docker-compose.yml`, `docs/PROJECT_KNOWLEDGE.md`):

| Application | Path | Default Port | Responsibility |
| --- | --- | ---: | --- |
| `backend` | `backend/` | `4000` | Express REST API, Prisma ORM, PostgreSQL, Socket.IO realtime, file uploads, Swagger/OpenAPI |
| `customer-web` | `customer-web/` | `5173` | Customer marketplace, service discovery, request creation, quote acceptance, booking & payment |
| `worker-web` | `worker-web/` | `5174` | Worker onboarding/KYC, request feed, quoting, job execution, availability, earnings, boosts |
| `admin-web` | `admin-web/` | `5176` | Platform operations, KYC review, user/worker management, catalog, RBAC, disputes, config |

Supporting directories:
- `docs/PROJECT_KNOWLEDGE.md` — Maintained implementation map.
- `docker-compose.yml` — Orchestrates `postgres` (host port `5433`), `backend`, `customer-web`, `worker-web`, and `admin-web`.

## Current Implementation Status

- **Backend**: Implemented with 17 route modules, 17 controllers, 19 services, 10 Zod validator modules, Socket.IO server, and 8 Prisma migrations. (VERIFIED: `backend/src/`, `backend/prisma/migrations/`)
- **Frontends**: All three React/Vite frontends are implemented with routing, React Query, Axios refresh-queue client, and 5-locale i18n (`en`, `zh`, `my`, `th`, `hi`). (VERIFIED: `customer-web/src/`, `worker-web/src/`, `admin-web/src/`)
- **Testing & CI/CD**: No automated test files (`*.test.*` / `*.spec.*`) or `.github/workflows` CI pipelines exist in the repository. (VERIFIED: file search across workspace)
