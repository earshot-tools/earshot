---
paths:
  - shared/**
---

# Shared Types Rules

Use for shared TypeScript types and Zod schemas consumed by other workspaces.

## Required reads

Before changing shared files, read:

1. The issue or task instructions.
2. `AGENTS.md`.
3. The exact affected `shared/` files.
4. Consumers in other workspaces (grep for the affected exports).

## Constraints

- Zod schemas are the source of truth. Types are derived via `z.infer`.
- Use `as const` objects, not `enum`.
- Barrel exports via `index.ts` only — no deep imports across workspaces.
- Every public API change must include a corresponding contract test.
- A breaking change requires updating every consumer in the same PR. No "fix it later".

## Skills

- `/shared-types-work <issue>` for shared implementation issues.
