# Technical Memory

- **Dual API Mounting**: `backend/src/app.ts` mounts all routers on both `/api/v1/:locale` and `/api`. Always keep both working. (VERIFIED)
- **Monetary Snapshots**: `Booking` snapshots `subtotal`, `platformFee`, `workerEarnings`, `total`, and commission percentage at quote acceptance so later `PlatformConfig` changes do not alter historical bookings. (VERIFIED: `docs/PROJECT_KNOWLEDGE.md`)
- **Redis is Optional**: `backend/src/config/redis.ts` connects lazily only when `REDIS_URL` is configured. (VERIFIED)
- **Dynamic Boost Tiers**: Stored in `PlatformConfig.boostTiers` (`singleton` row) with a compatibility fallback in code until an admin saves a config. (VERIFIED: `docs/PROJECT_KNOWLEDGE.md`)
