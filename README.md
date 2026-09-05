# Local Services Marketplace

A production-ready on-demand local services marketplace similar to Uber/TaskRabbit. Customers connect with local workers (plumbers, electricians, cleaners, mechanics, etc.) for home and personal services in markets like Myanmar with MMK currency.

## Architecture

Three completely independent projects:

```
local-services-marketplace/
├── customer-web/   # React + Vite + TS - for customers only
├── worker-web/     # React + Vite + TS - for workers only
└── backend/        # Node + Express + TS - shared API + Socket.IO + Prisma
```

The two frontends are independent and only share the backend API. Customers never see worker pages and vice versa.

## Quick Start (Docker)

```bash
# from the repo root
cp backend/.env.example backend/.env
docker compose up --build
```

Services:
- Backend: http://localhost:4000
- Customer Web: http://localhost:5173
- Worker Web: http://localhost:5174
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Quick Start (Local Dev)

Requires Node.js 20+ and PostgreSQL 15+.

```bash
# 1. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev

# 2. Customer web (new terminal)
cd customer-web
cp .env.example .env
npm install
npm run dev

# 3. Worker web (new terminal)
cd worker-web
cp .env.example .env
npm install
npm run dev
```

## Demo Credentials

After running `npm run seed` in `backend`:

| Role     | Email                       | Password    |
|----------|------------------------------|------------|
| Admin    | admin@demo.com              | Admin@123  |
| Customer | customer@demo.com           | Customer@123|
| Worker   | plumber@demo.com            | Worker@123 |
| Worker   | electrician@demo.com        | Worker@123 |
| Worker   | cleaner@demo.com            | Worker@123 |
| Worker   | mechanic@demo.com           | Worker@123 |

All demo workers are pre-approved.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma, Socket.IO, JWT, Zod, Helmet
- **Customer Web**: React, Vite, TypeScript, React Router, Tailwind, TanStack Query, Axios, RHF, Zod, Socket.IO Client
- **Worker Web**: Same stack as customer web
- **Infra**: Docker Compose, Redis, PostgreSQL

## End-to-End Flow

1. Customer registers & logs in
2. Searches workers, filters by service/location/rating
3. Creates a service request (photos, description, budget, schedule, location)
4. Backend matches nearby approved workers and emits Socket.IO events
5. Workers view request, send quote (price/duration/message)
6. Customer accepts one quote → other quotes auto-rejected → booking created
7. Worker updates status (CONFIRMED → ON_THE_WAY → ARRIVED → IN_PROGRESS → COMPLETED)
8. Customer pays (cash on completion / future: KBZPay, Wave Money, etc.)
9. Customer leaves 1-5 star review
10. Worker earnings update with platform commission deducted

See `/backend/README.md` and the individual app READMEs for details.