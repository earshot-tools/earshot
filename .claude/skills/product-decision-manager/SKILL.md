---
name: product-decision-manager
description: Classify and log product decisions (UX, business-logic, domain rules) as individual files in docs/decisions/product/. Use when a product decision has been made and needs to be recorded.
disable-model-invocation: false
allowed-tools: Read Grep Edit Write Bash Glob
---

# Product Decision Manager

## Goal

Record product decisions as individual files in `docs/decisions/product/`.

## When to use

- A product decision has been made (UX, domain rules, business-logic).
- A decision from an answers file is classified as PRODUCT.
- Ingesting answers that contain product decisions.

## Classification rule

PRODUCT = affects product/UX/business logic.
If it affects both engineering and product → HYBRID → discuss with operator before logging.

## ID assignment

New decisions use **issue-number-based IDs**: `D-<issue-number>`.

- If the decision comes from a GitHub issue → use that issue number (e.g. `D-415`).
- If the decision comes from an answers file → create an issue first via `/create-issue`, then use that number.

This eliminates ID collisions between parallel sessions.

## Pre-flight checklist

- [ ] Confirm this is product, not engineering.
- [ ] Check for duplicate/conflicting decisions: `Grep` in `docs/decisions/product/`.
- [ ] Determine the decision ID (issue number).

## File shape

See `docs/decisions/product/README.md` for the canonical file shape (Context / Decision / Alternatives / Consequences / References).

## Output

Print:

- The new file path: `docs/decisions/product/D-<n>.md`.
- A 1–2 sentence summary of the decision.
- Any superseded decisions (link by ID).
