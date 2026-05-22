---
name: analyze
description: Investigate any problem, question, or concern — search code, check decision logs, query data sources if applicable, then create a GitHub issue with evidence-based findings. Use for bugs, UX concerns, telemetry questions, feature gaps, or anything needing investigation before action.
argument-hint: '[description of the problem, question, or screenshot path]'
disable-model-invocation: true
allowed-tools: Bash Read Write Edit Grep Glob Agent
---

# Analyze and Create GitHub Issue

Investigate the reported problem thoroughly, then create a GitHub issue with findings.

Handles **any type of analysis** — bugs, UX problems, missing features, telemetry anomalies, design questions, or "why does X work this way?" investigations.

## Input

`$ARGUMENTS` — description of the problem/question, a path to a screenshot, or both.

## Steps

### 0. Ensure latest code

```bash
git checkout main
git pull origin main
```

If the working tree is dirty, note it and investigate against the current state. Do NOT stash without operator approval.

### 1. Check for duplicates

```bash
gh issue list --search "<relevant keywords>" --state open --limit 20
gh issue list --search "<relevant keywords>" --state closed --limit 20
```

If a matching issue exists, tell the operator and link to it. Do not create duplicates.

### 2. Understand the problem

- If a screenshot path is provided, read and analyze it. Describe what the screenshot shows in text (local paths don't render on GitHub).
- Summarise what the operator is asking about — bug, UX concern, telemetry question, or feature gap.
- Ask the operator for clarification ONLY if the problem is genuinely unclear.

### 3. Classify the issue

Determine the type:

- **bug** — something is broken or produces wrong results.
- **enhancement** — existing feature could be improved.
- **feature** — new functionality needed.
- **question** — design decision that needs discussion.

### 4. Check decision and idea logs

Before investigating code, check if this was already discussed or decided:

- `Grep` for keywords in `docs/decisions/product/` — look for `D-XXXX` files.
- `Grep` for keywords in `docs/decisions/engineering/` — look for `E-XXXX` files.
- `Grep` for keywords in `docs/backlog/ideas.md` — look for `IDEA-XXXX`.
- `Read` relevant sections of `docs/architecture/` if architecture-related.

If a decision exists, reference it in the issue. If the problem contradicts a decision, flag this.

### 5. Investigate code

Search the codebase for relevant code. Document:

- The exact file(s) and line number(s) relevant to the issue.
- Why the current behaviour exists (intentional or oversight).
- What the expected/improved behaviour should be.

### 6. Query data sources (if applicable)

If the issue involves telemetry, progress, or persisted state, query the data:

- Local development DB via the workspace's documented query script.
- Production data only via documented runbooks (`docs/runbooks/`). Never paste production data into the issue body unredacted.

Include actual query output in the issue body — concrete data, not assumptions.

### 7. Assess priority

Choose from labels defined in the repo (`gh label list`):

- **high** — broken feature, no workaround, significant UX issue.
- **medium** — has workaround, edge case, cosmetic.
- **low** — nice-to-have, design discussion.

### 8. Create the issue

Delegate to `/create-issue` skill with all findings compiled. Use this body structure:

```markdown
## Problem / Question

[What the operator sees or is asking about — 1–2 sentences]

## Current Behavior

[How it works now, with code references (file:line)]

## Expected / Proposed Behavior

[What should happen instead]

## Investigation

### Code

[File paths with line numbers, relevant snippets]

### Data

[DB query results if applicable]

### Decision Context

[D-XXXX, E-XXXX, IDEA-XXXX references]

## Proposed Approach

[Specific changes needed — files, methods, strategy]

## Impact

[Workspaces/screens affected, scope of change]
```

### 9. Report back

Tell the operator:

- The issue URL.
- A 3-line summary of findings.
- Priority assessment.
- Recommendation: fix now / fix next session / discuss with stakeholder first / route to `/architecture`.

## Rules

- Always investigate before creating the issue — never create issues based on assumptions.
- Always check for duplicate issues first.
- Always check decision logs for context.
- Include actual data when querying production-like sources.
- Reference specific file paths and line numbers.
- Describe screenshots in text — local file paths don't work in GitHub issues.
- Keep the issue body factual and evidence-based — no speculation.
- Use correct labels from the approved list — do not create new labels.
- Use `gh` CLI for GitHub operations.
- If investigation reveals a product decision is needed, recommend `/generate-questionnaire` instead of guessing.
- If investigation reveals a missing engineering fact, recommend `/generate-research-brief`.
- If investigation relates to an existing idea, note the `IDEA-XXXX` reference.
