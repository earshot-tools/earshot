---
name: log-idea
description: Log a new idea to docs/backlog/ideas.md with auto-incrementing ID and timestamp. Use when the user says /log-idea followed by their idea text.
argument-hint: <idea text>
disable-model-invocation: false
allowed-tools: Read Write Grep Bash Edit
---

# Log Idea

## Goal

Append a new idea entry to `docs/backlog/ideas.md` with auto-incrementing `IDEA-XXXX` ID, today's date, `new` state, and the user's idea text.

## What belongs in ideas.md (vs an issue)

Ideas are the default capture surface for anything speculative, not-yet-prioritised, or cut from an active PR. GitHub issues are for concrete, ready-to-work, prioritised deliverables only. When in doubt, log as idea — ideas are cheap.

Examples that belong in `ideas.md`:

- **Scope cut from an active PR** — a feature/refactor grew the PR beyond what's reviewable; capture as idea to revisit, don't spin off an issue that will sit cold.
- **Refactor noticed while working on something unrelated** — "while I was in here I noticed X could be better" → idea, not mid-PR scope creep, not new issue.
- **Research follow-up that has been deprioritised**.
- **"We could eventually…" / "what if we…"** — speculative design thoughts during discussion.
- **Non-blocking tech debt noticed in passing**.
- **Tooling / workflow ideas** with no urgency.

Examples that should skip this skill and use `/create-issue` instead:

- Bug breaking production.
- Concrete deliverable with acceptance criteria and a clear "who".
- Anything blocking active work.

## Pre-flight checklist

- [ ] File `docs/backlog/ideas.md` exists.
- [ ] Idea text is provided as argument.

## Output

Append a row to the table:

```text
| IDEA-XXXX | new | <tags> | <idea text> |
```

Where `XXXX` is the next number (4-digit, zero-padded). Print the new ID after appending.
