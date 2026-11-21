# Shared AI Memory (`.ai/`)

This directory is the shared, provider-agnostic project memory for all AI coding agents working on **Local Services Marketplace** (`on-demand-app`).

## How to Use This Memory

1. **Before starting work**, read:
   - [AGENTS.md](../AGENTS.md) (repository rules & working agreement)
   - [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
   - [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [tasks/CURRENT_TASK.md](./tasks/CURRENT_TASK.md)
   - [handoffs/LATEST_HANDOFF.md](./handoffs/LATEST_HANDOFF.md)
2. **During work**, consult domain-specific docs:
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
   - [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
   - [DATA_FLOW.md](./DATA_FLOW.md)
   - [MODULE_MAP.md](./MODULE_MAP.md)
   - [CODING_CONVENTIONS.md](./CODING_CONVENTIONS.md)
   - [SECURITY.md](./SECURITY.md)
   - [BUILD_AND_DEPLOYMENT.md](./BUILD_AND_DEPLOYMENT.md)
3. **After significant changes**, update:
   - Relevant technical docs if contracts, schemas, or architecture changed
   - `memory/` files for new discoveries, bugs, or limitations
   - `tasks/` and `handoffs/` to reflect current state

## Knowledge Classification

All facts in this directory are classified as:
- **VERIFIED**: Confirmed directly from source code, `schema.prisma`, `package.json`, or configuration files.
- **INFERRED**: Strongly supported by implementation patterns but not explicitly documented.
- **UNKNOWN**: Cannot be established from available evidence.
