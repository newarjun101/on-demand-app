# customer-web — Local Services Marketplace

The customer-facing web app. See the [main README](../../README.md) for the
full project documentation.

## Quick start

```bash
cp .env.example .env      # set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev              # http://localhost:5173
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
- **Tailwind CSS 3** for styling
- **react-hook-form + zod** for forms (with the `zod-helpers.ts` translated validators)
- **Axios** with refresh-token interceptor
- **Socket.IO Client** for real-time
- **react-hot-toast** for toasts
- **lucide-react** for icons
- **date-fns** for date formatting

## Source layout

```
src/
├── api/                  # axios client + endpoint wrappers
├── components/           # Reusable UI (Avatar, Button, WorkerCard, LocaleSwitcher, ...)
├── contexts/             # React contexts (AuthContext)
├── hooks/                # Custom hooks (usePagination, useSocket, ...)
├── i18n/                 # Internationalization (5 locales)
│   ├── locales/          # en, zh, my, th, hi .json files
│   └── index.tsx         # I18nProvider + useI18n hook
├── layouts/              # CustomerLayout (header + bottom nav)
├── pages/                # Route components
├── routes/               # Route table (in App.tsx)
├── types/                # TypeScript types
├── utils/                # formatMmk, resolveImageUrl, zod-helpers
├── App.tsx               # Root with I18nProvider, AuthProvider, RouterProvider
├── main.tsx              # entry
└── index.css             # tailwind + toast close button
```

## Adding a new page

1. Create `src/pages/MyPage.tsx` — use `useI18n()` for all text:

```tsx
import { useI18n } from '@/i18n';

export function MyPage() {
  const { t } = useI18n();
  return <h1>{t('myPage.title')}</h1>;
}
```

2. Add the key to all 5 locale files: `src/i18n/locales/{en,zh,my,th,hi}.json`

3. Register the route in `App.tsx`:

```tsx
<Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
```

## Adding a new translation

Edit each locale file in `src/i18n/locales/`. Use **dot notation** for nesting:

```json
{
  "myPage": {
    "title": "My title",
    "button": { "save": "Save", "cancel": "Cancel" }
  }
}
```

Access with `t('myPage.title')` or `t('myPage.button.save')`.

For values with placeholders, use `{{name}}`:

```json
{ "greeting": "Hello, {{name}}" }
```

```ts
t('greeting', { name: 'Aung' })   // "Hello, Aung"
```

## License

MIT
