# Bug Memory

Confirmed caveats/bugs observed in the current source (VERIFIED: `docs/PROJECT_KNOWLEDGE.md` Section 10):

1. **Route Shadowing in `worker.routes.ts`**: `GET /:id` is registered before `GET /me/profile`, so `GET /workers/me/profile` is matched as a public-profile lookup for ID `me`.
2. **Missing Ownership Check in `bookingService.getById`**: Fetches a booking for any authenticated user without verifying the caller is the booking's customer, worker, or an admin.
3. **Missing Ownership Check in `requestService.getById`**: Returns a request for any authenticated user without verifying customer/worker participation.
4. **Admin Error Localization**: Some textual responses in `admin.routes.ts` bypass the shared translated error helper.
5. **Vite Build-Time Env Vars**: `docker-compose.yml` passes `VITE_API_URL` and `VITE_SOCKET_URL` as runtime `environment:` variables, whereas Vite substitutes `VITE_*` at build time.
