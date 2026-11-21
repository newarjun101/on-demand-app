# Tech Stack

- **Backend**: Node.js >=20, TypeScript, Express, Prisma ORM, PostgreSQL 15, Socket.IO, Zod, Argon2, JWT, Swagger/OpenAPI
- **Frontends**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, TanStack React Query, Axios, 5-locale i18n (`en`, `zh`, `my`, `th`, `hi`)
- **Infrastructure**: Docker Compose, Nginx (frontend containers)

## Responsive Design Conventions

All three frontends are mobile-first Tailwind apps. Target widths: phone (~375px), tablet (~768px), desktop (1280px+).

- Use unprefixed classes for phones and add `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px) overrides upward.
- Page header rows (title plus actions) use `flex flex-wrap items-center justify-between gap-3` so actions wrap on narrow screens.
- Grids must start from a small column count (`grid-cols-1` or `grid-cols-2`) and increase with breakpoints.
- Wrap wide tables in `overflow-x-auto` (or put the class on the `Card`).
- Modals (`fixed inset-0`) use `p-4 sm:p-6` and `max-h-[90vh] overflow-y-auto` so tall content scrolls on short screens.
- `admin-web` sidebar is an off-canvas drawer below `lg` (hamburger in the header) and a collapsible static sidebar from `lg` up. `customer-web` uses a bottom nav below `md`.
- Keep touch targets at least 40px tall on phones and keep the viewport meta tag in each `index.html`.
- Check layouts at 375px, 768px, and 1280px before finishing a UI change.
- Fixed bottom navs use `pb-[max(0.5rem,env(safe-area-inset-bottom))]`, and the page `<main>` reserves `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0` so content is not covered. Each `index.html` sets `viewport-fit=cover`.
- Form fields are 16px on phones (rule in each `index.css`) to stop iOS Safari zooming on focus.
- Never hide an action on phones without a replacement. The worker online/offline toggle is icon-only below `sm`.
