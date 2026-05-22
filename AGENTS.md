# AGENTS.md — lean agent bootstrap

Purpose: keep agent startup cheap. This file is the first routing document.
Read `docs/ai-index.md` second for task-area routing.

## Core rule

Read only what the task needs, then read exact source files before editing or deciding. RAG/search results are leads, not authority.

## Startup route

1. Read `AGENTS.md`.
2. Read `docs/ai-index.md`.
3. Read the issue or task instructions.
4. Read only the exact authoritative files selected by the issue scope and `docs/ai-index.md`.

## Agent IDs

Use one ID per task. The ID decides which route to use in `docs/ai-index.md`.

| Agent ID       | Use for                                           |
| -------------- | ------------------------------------------------- |
| `product`      | ideas, product decisions, UX, business logic      |
| `architecture` | system design, cross-area planning, eng decisions |
| `shared`       | shared TypeScript types, Zod schemas, contracts   |
| `devops`       | CI, deploy, infra, local tooling                  |
| `qa`           | tests, a11y, visual regression, smoke checks      |

Visible labels are display aliases only; Agent IDs are the routing keys.

- `product`: `🎯 Product Explorer`
- `architecture`: `🏛️ Architect / Principal Engineer`
- `shared`: `🔗 Shared Types Engineer`
- `devops`: `🚀 DevOps`
- `qa`: `🧪 QA / Test Engineer`

## Non-negotiable workflow

- Never commit directly to `main`.
- Identify the GitHub issue before any file change.
- One issue → one branch/worktree → one PR.
- Read the issue, `AGENTS.md`, `docs/ai-index.md`, routed authoritative docs, and exact source files before editing.
- Keep scope tight. Do not fix unrelated discoveries inline; log them as ideas (`/log-idea`) or open follow-up issues only if they pass the issue gate.

## Source of truth order

1. Accepted product decisions: `docs/decisions/product/*.md`
2. Accepted engineering decisions: `docs/decisions/engineering/*.md`
3. Architecture docs: `docs/architecture/*.md`
4. Convention docs: `docs/conventions/`
5. Engineering research findings: `docs/engineering-research/findings-*.md`
6. Exact source files and tests

Newest accepted decision wins on conflict.
