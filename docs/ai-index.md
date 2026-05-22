# AI Index — task-area routing

Read this after `AGENTS.md`. Pick the route for your Agent ID, then read only the listed authoritative files for the task in scope.

## architecture

- `.claude/skills/architecture/SKILL.md`
- `docs/conventions/agentic-issue-slicing.md`
- `docs/conventions/branch-strategy.md`
- `docs/conventions/commit-template.md`
- Accepted decisions in `docs/decisions/engineering/` and `docs/decisions/product/`

## product

- `.claude/skills/product-work/SKILL.md` (edit domain stub on first use)
- `docs/decisions/product/`
- `docs/backlog/ideas.md`

## shared

- `.claude/skills/shared-types-work/SKILL.md`
- `shared/README.md`
- `shared/src/` (exact files in scope only)

## devops

- `.claude/skills/devops-work/SKILL.md`
- `.github/workflows/`
- `Makefile`
- `lefthook.yml`

## qa

- Tests under each workspace's `src/__tests__/` or `tests/`
- `playwright.config.ts` per app (when present)
