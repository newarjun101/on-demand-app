# worker-web — Local Services Marketplace

The worker-facing web app. See the [main README](../../README.md) for the
full project documentation.

## Quick start

```bash
cp .env.example .env      # set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev              # http://localhost:5174
```

## Scripts

| Command            | What it does                         |
|--------------------|--------------------------------------|
| `npm run dev`      | Vite dev server with hot reload      |
| `npm run build`    | Build production bundle to `dist/`   |
| `npm run preview`  | Preview the built bundle             |
| `npm run lint`      | ESLint                                |

## Tech stack

- **React 18 + Vite 5 + TypeScript 5.5**
- **React Router 6** for routing
- **TanStack Query 5** for server state
- **Tailwind CSS 3** for styling (green theme vs. customer-web's blue)
- **react-hook-form + zod** for forms
- **Axios** with refresh-token interceptor
- **Socket.IO Client** for real-time
- **react-hot-toast** for toasts
- **lucide-react** for icons
- **date-fns** for date formatting

## Source layout

```
src/
├── api/                  # axios client + endpoint wrappers
├── components/           # Reusable UI (Avatar, Button, BoostCard, LocaleSwitcher, ...)
├── contexts/             # React contexts (AuthContext)
├── hooks/                # Custom hooks (useSocket, ...)
├── i18n/                 # Internationalization (5 locales)
├── layouts/              # WorkerLayout (header + bottom nav)
├── pages/                # Route components (Dashboard, Jobs, Boost, Analytics, ...)
├── routes/               # Route table (in App.tsx)
├── types/                # TypeScript types
├── utils/                # formatMmk, zod-helpers, BOOKING_STATUS_LABELS
├── App.tsx               # Root with I18nProvider, AuthProvider, RouterProvider
├── main.tsx              # entry
└── index.css             # tailwind + toast close button
```

## Adding a new page

Same pattern as the customer-web. Use `useI18n()` for text and add keys to
all 5 locales.

## Worker pages

| Path              | Purpose                                        |
|-------------------|------------------------------------------------|
| `/dashboard`      | KPIs, recent requests, upcoming jobs, earnings  |
| `/onboarding`     | 4-step setup wizard                            |
| `/requests`       | Job request feed                               |
| `/requests/:id`   | Request detail with quote form                 |
| `/jobs`           | List of accepted jobs                           |
| `/jobs/:id`       | Job detail with status action buttons         |
| `/calendar`       | Weekly calendar with availability             |
| `/services`       | Manage services + bulk-add                     |
| `/availability`   | Set working hours (multi-slot per day)         |
| `/boost`          | Purchase profile boost                         |
| `/analytics`      | View-source breakdown, conversion metrics     |
| `/earnings`       | Earnings summary with transaction history      |
| `/messages`       | List of customer conversations                |
| `/messages/:id`   | Chat with a customer                          |
| `/notifications`  | All notifications                             |
| `/profile`        | Edit profile, photo, bio, location, radius     |
| `/settings`       | Change password                               |
| `/login` `/register` | Auth flows                                  |

## Dynamic boost tiers

The Boost page loads its options from `GET /pricing`. Do not hard-code prices,
durations, labels, or factors in the worker UI: administrators maintain them in
the Admin portal. Send the selected tier's exact `days` and `amount` to
`POST /me/boost`; the backend validates the choice against the active tiers.

## License

MIT
