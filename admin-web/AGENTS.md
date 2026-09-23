# Admin Portal Agent Guide

Read `../docs/PROJECT_KNOWLEDGE.md` and the root `AGENTS.md` first.

- Keep API calls in `src/api/endpoints.ts`, session/permissions in the auth
  context, and route screens in `src/pages`.
- Do not bypass backend permissions with UI-only authorization checks.
- Use `src/components/Pagination.tsx` for every operational list and keep it
  visible after a successful list load, including one-page results.
- KYC list actions must link to the worker KYC detail route and display worker
  identity, never a raw worker profile ID as the primary label.
- Boost tiers are edited here via `/admin/pricing/config`; keep fields aligned
  with the backend tier shape: `id`, `label`, `days`, `amount`, `boostFactor`.
- Add UI copy to all five locale files and verify with `npm run build`.
