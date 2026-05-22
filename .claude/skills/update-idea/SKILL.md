---
name: update-idea
description: Update the state of an existing idea in docs/backlog/ideas.md. Used by Claude (not user) when an idea is being explored, decided, deferred, or rejected.
argument-hint: '<IDEA-XXXX> <new-state> [note]'
disable-model-invocation: false
allowed-tools: Read Edit Grep Write Bash
---

# Update Idea

## Goal

Change the state of an existing idea in `docs/backlog/ideas.md` and optionally add a note.

## Commands used

`Read` (`docs/backlog/ideas.md`), `Edit` (update State line, append to Notes).

## Pre-flight checklist

- [ ] Idea exists in `docs/backlog/ideas.md`.
- [ ] Target state is valid (`new`, `exploring`, `decided`, `deferred`, `rejected`).
- [ ] If state is `decided`, a `D-XXXX` or `E-XXXX` reference is provided.

## Output format

Print:

- The updated row.
- Old state → new state.
- Decision reference if `decided`.
