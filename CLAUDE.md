# Claude Project Router — earshot

Purpose: keep Claude startup context small. This file is always-loaded routing and project-wide policy only. Long role manuals, command tables, and subsystem rules live in path-scoped rules (`.claude/rules/`), skills (`.claude/skills/`), and docs.

## Startup order

1. Read `AGENTS.md`.
2. Read `docs/ai-index.md`.
3. Read the issue or task instructions.
4. Read only the exact routed docs and source files needed for the task.

Do not preload full manuals or broad directories.

## Agent role

Use the Agent IDs in `AGENTS.md`. If a role does not fit, ask the operator which role applies.

## Non-negotiable workflow

- Never commit directly to `main`.
- Identify the GitHub issue before changing any file.
- One issue → one branch/worktree → one PR.
- Read issue + `AGENTS.md` + `docs/ai-index.md` + routed authoritative docs + exact source files before editing.
- Keep scope tight. Don't fix unrelated discoveries inline — log as idea or open a follow-up issue only if it passes the issue gate.

## Enforcement model

`CLAUDE.md`, `.claude/rules/*.md`, and `SKILL.md` prose guide the model. They are not hard enforcement.

If a rule must always happen, enforce it with hooks, permissions, scripts, tests, CI, wrappers, or workflow tools.

## Skills

Skills live in `.claude/skills/`. Each is a deterministic workflow with stop gates.

- `/architecture` — principal-engineer session for cross-area design + decisions
- `/work-on-issue <n>` — generic implementation flow (issue → branch → TDD → PR)
- `/shared-types-work <n>` — shared types/schemas flow
- `/devops-work <n>` — CI/infra/tooling flow
- `/product-work` — product validation flow (edit SKILL.md first to fill domain stub)
- `/create-issue` — gated issue creation
- `/code-review` — generic PR review
- `/log-idea`, `/list-ideas`, `/update-idea`, `/discuss-idea` — backlog ideas mechanics
- `/engineering-decision-manager`, `/product-decision-manager` — log decisions
- `/generate-research-brief`, `/ingest-research` — engineering research flow
- `/generate-questionnaire`, `/ingest-answers` — product decision flow
- `/analyze` — investigate then file issue

## Source of truth order

1. Accepted product decisions: `docs/decisions/product/*.md`
2. Accepted engineering decisions: `docs/decisions/engineering/*.md`
3. Architecture docs: `docs/architecture/*.md`
4. Convention docs: `docs/conventions/`
5. Engineering research findings: `docs/engineering-research/findings-*.md`
6. Exact source files and tests

If sources conflict, prefer the newest accepted decision. If still unclear, ask the operator or run the required decision/research flow.

## Path-scoped rules

Supplemental role guidance lives in `.claude/rules/`. Treat these as supplemental routing, not the only source of any rule.

## Issue and PR rules

- GitHub is the planning system.
- Child implementation issues must be Codex-sized, test-first, and bounded.
- PRs must carry visible verification evidence and explicit issue linkage.
- Use `.github/pull_request_template.md` for PR body expectations.

## Command policy

Use Makefile targets where available. Do not bypass workflow wrappers for branching, issue creation, PR creation, merge, deploy, tests, or infra checks.
