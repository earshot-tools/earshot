---
name: product-work
description: Product Explorer workflow — loads all context, reads decisions/architecture/constraints/ideas, then validates problems, assesses impact across user segments, frames decisions, and hands off to engineering. Use when Product Explorer starts work on any topic.
argument-hint: '<topic-or-idea-number>'
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob Agent Skill
---

# Product Work

> **FIRST-USE BANNER.** This skill ships with empty domain blocks. Before invoking `/product-work` for the first time on this project, edit the **Product vision** and **User segments** and **Stakeholders** sections below to reflect your actual domain. The skill is intentionally generic — fill it in, do not leave it blank.

## Goal

Load ALL product context before making any decision, writing any questionnaire, or exploring any idea. Then work through the product thinking lifecycle: validate the problem, understand the user segments, frame decisions, and hand off to engineering.

**Critical:** Steps 1–3 are MANDATORY. Never skip context loading. Bad product decisions almost always trace back to not reading existing decisions first — duplicate decisions, contradictions, and rework all stem from skipping context.

---

## Product vision

> **TO FILL IN:** one paragraph describing what this product is, what it does, and who it's for. Example shape: "A learning game for children that teaches X through Y. Used at home and in classrooms."

<edit me before first use>

---

## User segments

> **TO FILL IN:** the distinct user segments your product serves, and the differences that matter for product decisions. Common shapes: end-users vs adult stakeholders; neurotypical vs neurodiverse; free vs paid; consumer vs enterprise.

| Segment | Description | Needs | What it changes about decisions |
| ------- | ----------- | ----- | ------------------------------- |
| <name>  | <desc>      | <…>   | <…>                             |
| <name>  | <desc>      | <…>   | <…>                             |

---

## Stakeholders

> **TO FILL IN:** people other than end-users who influence product decisions (parents, teachers, admins, compliance, regulators, paying customers).

| Stakeholder | Role | Needs | Touch points |
| ----------- | ---- | ----- | ------------ |
| <name>      | <…>  | <…>   | <…>          |

---

## Required reads (mandatory)

1. `AGENTS.md`.
2. `docs/ai-index.md` (product route).
3. Every existing `D-XXXX` in `docs/decisions/product/` — at least skim the titles, read in full any that touch the topic in scope.
4. Relevant `E-XXXX` in `docs/decisions/engineering/` if the topic has cross-area impact.
5. `docs/backlog/ideas.md` — check if this is already an explored or deferred idea.

## Workflow

1. **Validate the problem.** What pain does this solve? For whom? How big is it? If you can't state the problem in one sentence, more validation is needed.
2. **Assess segment impact.** For each segment listed above, what would this change? Could it harm one segment while helping another?
3. **Frame the decision.** Options + pros/cons/risks per segment. Cite existing decisions or conventions when the choice is already settled.
4. **Decide or defer.**
   - If a clear decision can be made, route to `/product-decision-manager`.
   - If stakeholder input is needed, route to `/generate-questionnaire`.
   - If the idea isn't urgent, route to `/log-idea` or `/update-idea` (state: deferred).
5. **Hand off to engineering** only after the product decision is logged.

## Stop gates

- Decision affects engineering boundaries (auth, data model, public API, deployment) → mark HYBRID, loop in `/architecture`.
- Decision would override an existing accepted decision → discuss with operator, only one decision can be "accepted" at a time.
- "User says" without a segment named → push back: which segment, how do we know.

## Skills

- `/log-idea`, `/list-ideas`, `/discuss-idea`, `/update-idea` — backlog mechanics.
- `/generate-questionnaire`, `/ingest-answers` — stakeholder input flow.
- `/product-decision-manager` — log accepted decisions.
- `/architecture` — when product crosses into engineering architecture.
