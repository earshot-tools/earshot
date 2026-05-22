---
name: discuss-idea
description: Pull an idea from docs/backlog/ideas.md and start a structured discussion with the user. Use when the user says /discuss-idea with an IDEA-XXXX number, or without a number to discuss the highest-priority new idea.
argument-hint: '[IDEA-XXXX]'
disable-model-invocation: false
allowed-tools: Read Grep Edit Write Bash
---

# Discuss Idea

## Goal

Start a focused discussion about a specific idea from `docs/backlog/ideas.md`. Help the operator think through feasibility, priority, and next steps.

## Commands used

`Read` (backlog/ideas, decision logs), `Edit` (update idea state to `exploring`), `Grep` (search for related decisions).

## Pre-flight checklist

- [ ] Idea found in `docs/backlog/ideas.md`.
- [ ] Related decisions read from both decision logs.
- [ ] Idea state updated to `exploring`.

## Output format

Structured discussion:

- **Quick assessment:** Effort / Impact / Urgency / Type.
- **Related decisions:** any `D-XXXX` / `E-XXXX` that touch this area.
- **Open questions:** what would need to be decided to act on this.
- **Recommended next step:** decide / defer / reject / open issue / generate questionnaire / generate research brief.
