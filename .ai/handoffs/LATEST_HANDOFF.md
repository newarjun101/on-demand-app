# Latest Handoff

- **Date**: 2026-11-21
- **Summary**: Responsive pass over `admin-web`, `customer-web`, and `worker-web` (Tailwind class changes only; no API, schema, or locale changes).
- **Changed**:
  - `admin-web` `AdminLayout.tsx`: sidebar is an off-canvas drawer below `lg`, collapsible static sidebar from `lg`.
  - Modals in admin and customer pages cap at `max-h-[90vh]` and scroll.
  - Page header rows use `flex-wrap gap-3`; admin Payments table and worker Calendar week grid scroll horizontally on phones; two-column forms stack below `sm`.
  - Customer and worker headers: truncating bottom-nav labels, safe-area padding, shorter brand text on phones. Worker online/offline toggle is now visible (icon-only) on phones.
  - Each `index.html` uses `viewport-fit=cover`; each `index.css` sets 16px form text below `sm`.
  - Conventions recorded in `.kiro/steering/tech.md` and `structure.md`.
- **Not verified**: `npm ci` fails in the sandbox (npm registry returns 403 for `zod@4.6.5` and `@hookform/resolvers`), so the builds were not run and nothing was checked in a browser. Only a syntax-level `tsc` parse of the changed files was done.
- **Next steps**:
  1. Run `npm --prefix <app> run build` for all three frontends.
  2. Check key pages at 375px, 768px, and 1280px.
  3. Remaining unreviewed spots: 3-column stat grids in admin `DashboardPage`/`KycDetailPage`, customer `BookingDetailPage`/`RequestDetailPage`, worker `JobDetailPage`/`ProfilePage`.
