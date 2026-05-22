# earshot

Local-only botless meeting capture, transcription, and speaker labeling for Obsidian on macOS.

## Workspaces

- `shared/` — TypeScript types + Zod schemas shared across apps

## Prerequisites

- Node.js >= 24
- pnpm 10.33.0 (`corepack enable && corepack prepare pnpm@10.33.0 --activate`)

## Install

```bash
pnpm install
```

This installs all workspace dependencies and wires up lefthook (pre-commit + pre-push gates).

## Common commands

```bash
pnpm format         # Prettier write across the repo
pnpm format:check   # Prettier check (read-only)
pnpm lint           # Run lint per workspace
pnpm type-check     # tsc --noEmit per workspace
pnpm test           # Run tests per workspace
```

Or per-workspace:

## Quality gates

- **pre-commit:** lint-staged runs Prettier + secretlint on staged files.
- **commit-msg:** commitlint enforces conventional commits.
- **pre-push:** Prettier + per-workspace `tsc --noEmit` + tests, in parallel.

Bypass in genuine emergencies with `git push --no-verify` (audit-visible).

## Project conventions

- Branch naming: `<area>/feature/<issue>-<slug>` or `<area>/fix/<issue>-<slug>`.
  See `docs/conventions/branch-strategy.md`.
- Commit format: conventional commits (`feat(server): ...`). See `docs/conventions/commit-template.md`.
- One issue → one branch → one PR. Never commit directly to `main`.

## Decisions, ideas, research

- `docs/decisions/engineering/` — engineering decisions (`E-<issue>.md`).
- `docs/decisions/product/` — product decisions (`D-<issue>.md`).
- `docs/backlog/ideas.md` — speculative, not-yet-prioritised items.
- `docs/engineering-research/` — Deep Research briefs + findings.

## Agent workflows

`.claude/` ships agent role routing, conventions, and Claude skills bundled with this template. See `AGENTS.md` for role IDs.

## Operations

### One-time repo setup

```bash
make repo-init     # apply branch protection to main (requires `gh auth login` as repo admin)
```

---

Scaffolded from [`monorepo-template`](https://github.com/earshot-tools/monorepo-template) by Inoyatov Khamidulla, 2026.
