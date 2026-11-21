# Repository Structure

- `backend/` — Express + Prisma + PostgreSQL + Socket.IO API server (port `4000`)
- `customer-web/` — React 18 + Vite customer marketplace (port `5173`)
- `worker-web/` — React 18 + Vite worker portal (port `5174`)
- `admin-web/` — React 18 + Vite admin portal (port `5176`)
- `.ai/` — Shared AI project memory
- `docs/PROJECT_KNOWLEDGE.md` — Implementation map
- `docker-compose.yml` — Full-stack orchestration

## Shared Layout Files (responsive behavior)

- `admin-web/src/layouts/AdminLayout.tsx` — sidebar drawer (mobile) / collapsible sidebar (desktop)
- `customer-web/src/components/CustomerHeader.tsx` — top nav (`md+`) and bottom nav (mobile)
- `worker-web/src/components/WorkerHeader.tsx` — worker top nav (`md+`) and bottom nav (mobile)
- Each app's `src/components/UI.tsx` holds shared primitives (Button, Card, Input); fix responsiveness there before patching individual pages.
