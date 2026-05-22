---
name: devops-work
description: Staff DevOps engineer workflow — loads all context, reads conventions/runbooks/decisions, then works on infrastructure, CI/CD, deploy, or tooling issues with full operational awareness. Use when DevOps Engineer starts work on any issue.
argument-hint: '<issue-number>'
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob Agent Skill
---

# DevOps Work (Staff Level)

## Goal

Load ALL DevOps context before making any changes. Then work on the issue following conventions, runbooks, and decisions — with full awareness of cost, security, observability, incident response, and cross-project impact.

**Critical:** Steps 1–4 are MANDATORY. Infrastructure mistakes are hard to reverse and affect all teams.

## Tech stack awareness (the parts that are universal)

| Layer             | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Monorepo          | pnpm workspaces                                  |
| Language          | TypeScript (strict)                              |
| CI/CD             | GitHub Actions                                   |
| Pre-commit        | lefthook + lint-staged + commitlint + secretlint |
| Command allowlist | `Makefile`                                       |
| Branch naming     | `devops/<type>/<slug>` or `devops/<topic>`       |
| Commit scope      | per-project or `devops` for root infra           |

Hosting provider, observability stack, error monitoring, secrets manager, and IaC tool are **project-specific** — see `docs/decisions/engineering/` for the choices that were logged.

## Required reads (mandatory)

1. The issue or task instructions.
2. `AGENTS.md`.
3. `docs/ai-index.md` (devops route).
4. The exact affected workflow/config/docs files.
5. Relevant engineering decisions in `docs/decisions/engineering/`.

## Workflow constraints

- Never commit directly to `main`.
- One issue = one branch/worktree = one PR.
- Use `Makefile` targets where available. Don't bypass workflow wrappers.
- Do not replace mechanical gates with markdown instructions. Hard gates belong in hooks, permissions, scripts, tests, CI, wrappers, or workflow tools.

## Engineering research

Use `/generate-research-brief` + `/ingest-research` when external engineering facts are required (versions, benchmarks, vendor limits, current practice).

## Stop gates

- Production-affecting change without rollback plan → stop, write the rollback.
- New service or vendor added without an `E-<n>` decision → stop, log the decision first.
- Hook/CI change that loosens existing gates → discuss with operator before merging.

## Skills

- `/generate-research-brief`, `/ingest-research`, `/engineering-decision-manager` for research and decisions.
- `/architecture` for cross-area infra design.
