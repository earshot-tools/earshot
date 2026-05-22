---
name: shared-types-work
description: Shared types engineer workflow — maintains TypeScript types and Zod schemas shared between server, web, app workspaces. Contract tests, API types, model types, error types. Use when Shared Types Engineer starts work on any issue in shared/.
argument-hint: '<issue-number>'
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob Agent Skill
---

# Shared Types Work

## Goal

Maintain TypeScript types and Zod schemas in `shared/` that are consumed by other workspaces. Every API endpoint has a contract. Every model has a single source of truth. No type duplication across projects.

**Critical:** Steps 1–4 are MANDATORY. Never skip context loading. Every type-drift bug came from not checking what already exists.

## Tech stack awareness

| Layer           | Technology                                         |
| --------------- | -------------------------------------------------- |
| Language        | TypeScript (strict mode)                           |
| Validation      | Zod (source of truth for types)                    |
| Type derivation | `z.infer<typeof schema>`                           |
| Constants       | `as const` objects, no `enum` keyword              |
| Testing         | Vitest — contract tests validate API responses     |
| Branch          | `shared/feature/<issue>-<slug>` / `shared/fix/...` |
| Commit scope    | `shared`                                           |
| Exports         | Barrel pattern — `index.ts` re-exports public API  |

## Consumers

`shared/` exports are consumed by other workspaces (server, web, app — whichever exist in this project). Before changing a public export, grep every consumer.

## Step 1: Load context (mandatory)

1. `AGENTS.md`.
2. `docs/ai-index.md` (shared route).
3. The issue body + all linked decisions.
4. `docs/conventions/branch-strategy.md`, `docs/conventions/commit-template.md`.
5. Existing schemas in `shared/`.
6. Consumers of any types/schemas you're about to change.

## Step 2: Plan

- Bounded list of schema/type files to change.
- Contract tests to add first.
- Migration plan for every consumer (in the same PR).

## Step 3: TDD

- Add contract tests under `shared/__tests__/` first.
- Use `z.safeParse` to validate API responses against the schema in integration tests.

## Step 4: Quality gates

```bash
cd shared && pnpm exec tsc --noEmit
cd shared && pnpm run test
```

Plus every consumer's type-check must still pass.

## Stop gates

- A breaking change without same-PR updates to every consumer → stop, expand the PR scope.
- Removal of a public export without checking grep results → stop.
- New type that duplicates an existing one → consolidate first.
