---
paths:
  - .github/**
  - Makefile
  - lefthook.yml
  - .claude/**
  - docs/conventions/**
---

# DevOps and Agent Workflow Rules

Use for CI, deploy, infrastructure, local tooling, Claude configuration, engineering research, and engineering decisions.

## Required reads

Before changing devops or agent-workflow files, read:

1. The issue or task instructions.
2. `AGENTS.md`.
3. `docs/ai-index.md`.
4. The exact affected workflow/config/docs files.
5. Relevant engineering decisions in `docs/decisions/engineering/`.

## Workflow constraints

- Never commit directly to `main`.
- Identify the GitHub issue before editing any file.
- One issue = one branch/worktree = one PR.
- Use repo workflow tools and Makefile targets where available.
- Do not replace mechanical gates with markdown instructions. Hard gates belong in hooks, permissions, scripts, tests, CI, wrappers, or workflow tools.

## Engineering research

- Use `docs/engineering-research/README.md` when external engineering facts are required.
- Findings are evidence inputs; engineering decisions are recorded in `docs/decisions/engineering/`.

## Skills

- `/devops-work <issue>` for devops implementation issues.
- `/generate-research-brief`, `/ingest-research`, `/engineering-decision-manager` for engineering research and decisions.
