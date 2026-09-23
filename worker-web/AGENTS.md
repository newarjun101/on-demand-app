# Worker Portal Agent Guide

Read `../docs/PROJECT_KNOWLEDGE.md` and the root `AGENTS.md` first.

- Keep this app independent from Customer and Admin; preserve
  `X-App-Origin: WORKER_WEB` and worker token storage.
- Approved-route guards improve UX but backend role and verification checks are
  the security boundary.
- Use `src/components/Pagination.tsx` for operational lists and keep it visible
  after results load, including a single page.
- The Boost screen consumes dynamic data from `GET /pricing`. Never hard-code a
  tier; submit the selected tier's exact `days` and `amount` to `/me/boost`.
- Add all user-visible copy to five locales and verify `npm run build`.
