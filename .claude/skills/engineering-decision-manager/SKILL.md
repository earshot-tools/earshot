---
name: engineering-decision-manager
description: Classify and log engineering decisions (architecture, Git, stack, testing, CI/CD) as individual files in docs/decisions/engineering/. Use when an engineering decision has been made and needs to be recorded.
disable-model-invocation: false
allowed-tools: Read Grep Edit Write Bash Glob
---

# Engineering Decision Manager

## Goal

Record engineering decisions as individual files in `docs/decisions/engineering/`.

## When to use

- An engineering decision has been made (stack, architecture, tooling, Git workflow, testing, CI/CD).
- A decision from an answers file is classified as ENGINEERING.
- An existing product decision needs reclassification.

## Classification rule

ENGINEERING = does **not** affect product/UX/business logic.
If it affects both → HYBRID → discuss with operator before logging.

## ID assignment

New decisions use **issue-number-based IDs**: `E-<issue-number>`.

- If the decision comes from a GitHub issue → use that issue number (e.g. `E-428`).
- If the decision comes from a conversation with no issue → create an issue first via `/create-issue`, then use that number.

This eliminates ID collisions between parallel sessions.

## Pre-flight checklist

- [ ] Confirm this is engineering, not product.
- [ ] Check for duplicate/conflicting decisions: `Grep` in `docs/decisions/engineering/`.
- [ ] Determine the decision ID (issue number).

## File shape

See `docs/decisions/engineering/README.md` for the canonical file shape (Context / Decision / Alternatives / Consequences / References).

## Output

Print:

- The new file path: `docs/decisions/engineering/E-<n>.md`.
- A 1–2 sentence summary of the decision.
- Any superseded decisions (link by ID).
