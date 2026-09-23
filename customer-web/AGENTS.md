# Customer Portal Agent Guide

Read `../docs/PROJECT_KNOWLEDGE.md` and the root `AGENTS.md` first.

- Keep this app independent from Worker and Admin; use only the shared backend
  contract through `src/api`.
- Preserve `X-App-Origin: CUSTOMER_WEB` and customer-specific token storage.
- Use React Query for remote state and invalidate relevant queries after writes
  or socket events.
- List pages use `src/components/Pagination.tsx`; show it after loaded results,
  even for a single page. Prefer backend pagination where supported.
- Add every user-facing string to `en`, `zh`, `my`, `th`, and `hi`, then run
  `npm run build`.
