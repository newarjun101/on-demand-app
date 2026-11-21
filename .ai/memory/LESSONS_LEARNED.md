# Lessons Learned

- Always read `docs/PROJECT_KNOWLEDGE.md` before modifying any workflow; it documents invariants (e.g., Prisma transactions on quote acceptance, 5-locale requirements) that are not obvious from a single file. (VERIFIED)
- Frontends are intentionally decoupled: do not attempt to share components across `customer-web`, `worker-web`, and `admin-web`. (VERIFIED)
