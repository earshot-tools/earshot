---
paths:
  - docs/decisions/product/**
  - docs/backlog/**
  - docs/questions/**
  - docs/answers/**
---

# Product Rules

Use for ideas, product decisions, UX, business-logic, and curriculum/learning-design (if your domain has those).

> **First-use note:** open `.claude/skills/product-work/SKILL.md` and fill in the domain stub (vision, user segments, stakeholders) before invoking `/product-work`. The skill blocks itself until the stub is non-empty.

## Required reads

Before logging a product decision, read:

1. The issue or task instructions.
2. `AGENTS.md`.
3. Existing decisions in `docs/decisions/product/` (check for duplicates / conflicts).
4. Existing answers in `docs/answers/` if this decision came from a questionnaire.

## Constraints

- Product decisions live in `docs/decisions/product/D-<issue>.md`.
- If a decision affects both product and engineering, mark it HYBRID and discuss with the operator before logging.
- Ideas live in `docs/backlog/ideas.md`. Use `/log-idea` to add. Don't open a GitHub issue for speculative work.

## Skills

- `/product-work` — product validation flow (edit domain stub first).
- `/log-idea`, `/list-ideas`, `/discuss-idea`, `/update-idea`.
- `/generate-questionnaire`, `/ingest-answers` for non-engineering questions.
- `/product-decision-manager` to log accepted decisions.
