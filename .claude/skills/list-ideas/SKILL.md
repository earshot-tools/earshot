---
name: list-ideas
description: List ideas from docs/backlog/ideas.md filtered by state. Use when the user says /list-ideas optionally followed by a state filter (new, exploring, decided, deferred, rejected, all).
argument-hint: '[new|exploring|decided|deferred|rejected|all]'
disable-model-invocation: false
allowed-tools: Read Grep
---

# List Ideas

## Goal

Show a summary table of ideas from `docs/backlog/ideas.md`, optionally filtered by state.

## Commands used

`Read` (`docs/backlog/ideas.md`), `Grep` (filter by state).

## Pre-flight checklist

- [ ] File `docs/backlog/ideas.md` exists.

## Output format

Markdown table: `| ID | State | Tags | Idea |` + count summary line.

If the file is empty (only header rows), print "No ideas logged yet" and exit.
