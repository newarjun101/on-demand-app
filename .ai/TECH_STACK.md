# Tech Stack

All versions below are **VERIFIED** from `package.json` files and `docker-compose.yml`.

## Backend (`backend/package.json`)
- **Runtime**: Node.js `>=20.0.0`, TypeScript `^5.5.4`, `tsx` `^4.23.13`
- **Framework**: Express `^4.19.2`
- **Database / ORM**: PostgreSQL 15 (`postgres:15-alpine`), Prisma `^5.20.0` (`@prisma/client` `^5.20.0`)
- **Realtime**: Socket.IO `^4.7.5`
- **Optional Cache**: `ioredis` `^5.4.1` (lazy connection when `REDIS_URL` is set)
- **Auth & Security**: `jsonwebtoken` `^9.0.2`, `argon2` `^0.40.3`, `helmet` `^7.1.0`, `cors` `^2.8.5`, `express-rate-limit` `^7.4.0`
- **Validation & Docs**: `zod` `^3.23.8`, `swagger-ui-express` `^5.0.1`
- **File Uploads**: `multer` `^1.4.5-lts.1`
- **Testing / Lint**: `vitest` `^2.0.5`, `eslint` `^8.57.0`, `prettier` `^3.3.3`

## Frontends (`customer-web`, `worker-web`, `admin-web`)
- **Core**: React `^18.3.1`, React DOM `^18.3.1`, Vite `^5.4.7`, TypeScript `^5.5.4`
- **Routing & Data**: `react-router-dom` `^6.26.2`, `@tanstack/react-query` `^5.59.0`, `axios` `^1.7.7`
- **UI & Styling**: Tailwind CSS `^3.4.13`, `lucide-react` `^0.445.0`, `react-hot-toast` `^2.4.1`, `clsx` `^2.1.1`
- **Forms & Validation**:
  - `customer-web` & `worker-web`: `react-hook-form` `^7.53.0`, `@hookform/resolvers` `^3.9.0`, `zod` `^3.23.8`
  - `admin-web`: `react-hook-form` `^7.88.0`, `@hookform/resolvers` `^5.9.1`, `zod` `^4.6.5`
- **Realtime**: `socket.io-client` `^4.7.5` (`customer-web` and `worker-web` only; not in `admin-web`)
- **Testing**: `vitest` `^2.0.5` (`customer-web` and `worker-web` only; not in `admin-web`)
