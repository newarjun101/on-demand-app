# Backlog

Confirmed unfinished work and potential improvements discovered from the repository (VERIFIED):

1. **Fix `worker.routes.ts` route ordering**: Move `GET /me/profile` (and static `/me/*` GET routes) above `GET /:id`.
2. **Add ownership checks**: Enforce customer/worker/admin ownership in `bookingService.getById` and `requestService.getById`.
3. **Add automated tests**: Implement Vitest unit/integration tests for `backend`, `customer-web`, `worker-web`, and add `vitest`/`eslint` to `admin-web`.
4. **Real payment gateway integration**: Replace immediate `PAID` marking with actual payment gateway callbacks.
5. **Localize admin error responses**: Replace raw textual responses in `admin.routes.ts` with the shared i18n error helper.
6. **Fix Vite build-time env in Docker**: Pass `VITE_*` as Docker `build.args` in `docker-compose.yml` or use runtime config.
