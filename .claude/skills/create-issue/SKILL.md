---
name: create-issue
description: Create a GitHub issue using gh CLI. Used by Claude proactively when a bug, feature, or task is identified during work. Also usable by user via /create-issue.
argument-hint: '<title> [--label label1,label2] [--body description]'
disable-model-invocation: false
allowed-tools: Bash Read Grep
---

# Create Issue

## Goal

Create a well-structured GitHub issue that is ready for deterministic human or agent implementation.

## How to invoke

```bash
gh issue create --title "<title>" --body-file ".tmp/<descriptive-name>.md" [--label ...]
```

- Always use `--body-file` pointing at a file under `.tmp/` for any non-trivial body. Inline `--body "..."` is for one-liners only.
- Issue titles must be short (<70 chars).
- Labels must exist on the repo first (run `gh label list` if unsure).

## Alignment with GitHub UI templates

Humans opening issues via the GitHub web UI see structured forms from `.github/ISSUE_TEMPLATE/` (`bug.yml`, `feature.yml`, `task.yml`). This skill is the primary method for AI/CLI issue creation. The skill's inline templates and the YAML templates should stay aligned in spirit — when one changes, consider whether the other needs updating.

- **Source of truth for AI:** this skill file (inline templates below).
- **Source of truth for human UI:** `.github/ISSUE_TEMPLATE/*.yml`.

## Inline templates

### Bug

```markdown
## Problem

<what is broken>

## Expected

<what should happen>

## Steps to reproduce

1.
2.

## Environment

<OS, runtime, app version>

## Suggested fix

<optional>
```

### Feature

```markdown
## Description

<what needs to be built>

## Why

<motivation, D-XXXX / E-XXXX refs>

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Out of scope

<what this issue does NOT cover>

## Test plan

- Unit:
- Integration:
- Manual:

## Files touched (estimate)

- <path>
```

### Task / chore

```markdown
## Description

<what needs to be done>

## Why

<motivation, D-XXXX / E-XXXX refs>

## Scope

<bounded list>

## Acceptance criteria

- [ ] Criterion 1

## Out of scope

<what this task does NOT cover>
```

## Slice gate

Before creating an implementation issue, check:

- [ ] Product decisions for this slice are logged (D-XXXX) — or N/A.
- [ ] Engineering decisions for this slice are logged (E-XXXX) — or N/A.
- [ ] Acceptance criteria are testable.
- [ ] A reasonable file-touch estimate exists.

If any answer is NO, route to `/architecture`, `/generate-research-brief`, or `/generate-questionnaire` first.

## Output

Print:

- The new issue URL.
- The title.
- The labels applied.
