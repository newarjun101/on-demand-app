# Project Memory

Durable project knowledge lives in `.ai/` and `docs/PROJECT_KNOWLEDGE.md`. Read these before non-trivial changes and update them after significant ones.

#[[file:.ai/PROJECT_CONTEXT.md]]

#[[file:.ai/memory/TECHNICAL_MEMORY.md]]

#[[file:.ai/memory/KNOWN_LIMITATIONS.md]]

#[[file:.ai/handoffs/LATEST_HANDOFF.md]]

## Where Memory Is Kept

| Need | File |
| --- | --- |
| Architecture, data flow, security | `.ai/ARCHITECTURE.md`, `.ai/DATA_FLOW.md`, `.ai/SECURITY.md` |
| Modules, schema, API | `.ai/MODULE_MAP.md`, `.ai/DATABASE_SCHEMA.md`, `.ai/API_DOCUMENTATION.md` |
| Product behavior | `.ai/PRODUCT_MEMORY.md` |
| Coding rules | `.ai/CODING_CONVENTIONS.md` |
| Bugs, lessons, terms | `.ai/memory/BUG_MEMORY.md`, `LESSONS_LEARNED.md`, `GLOSSARY.md` |
| Task tracking | `.ai/tasks/CURRENT_TASK.md`, `BACKLOG.md`, `COMPLETED.md` |
| Decisions | `.ai/decisions/` |
| Full implementation map | `docs/PROJECT_KNOWLEDGE.md` |

## Working Agreement

1. Before development read `.ai/PROJECT_CONTEXT.md`, `.ai/ARCHITECTURE.md`, `.ai/tasks/CURRENT_TASK.md`, and `.ai/handoffs/LATEST_HANDOFF.md`.
2. Inspect the real implementation first. Source code and the Prisma schema win over any document.
3. After a significant change, update the relevant `.ai/` files, record discoveries in `.ai/memory/`, update `.ai/tasks/`, and write `.ai/handoffs/LATEST_HANDOFF.md`.
4. Do not invent requirements and do not remove existing functionality.

## Standing Facts

- The three frontends never import from each other.
- Every router is mounted at `/api/*` and `/api/v1/:locale/*`.
- All user-facing text needs `en`, `zh`, `my`, `th`, `hi`.
- Money is integer MMK, with the commission snapshotted on the booking.
- Open issues: route shadowing of `GET /workers/me/profile`, missing ownership checks on `bookingService.getById` and `requestService.getById`, payment stub, no tests, no CI, Vite env vars passed at runtime instead of build time.
- Responsive work (admin drawer sidebar, scrolling modals, safe-area bottom navs, 16px phone inputs) is described in `tech.md`. Builds and browser checks for it are still pending.
