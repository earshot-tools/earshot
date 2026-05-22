---
name: code-review
description: Comprehensive PR code review across all monorepo workspaces. Stop-and-confirm gate selects checklists, then enforced table output for every check. Use when reviewing any PR.
argument-hint: '<pr-number>'
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob
---

# Code Review

## Goal

Review a PR across one or more workspaces with **evidence**, not opinion. Output is a checklist table — every line resolves to PASSED, SKIPPED (with reason), or NOT DONE (with evidence link).

## Stop-and-confirm gate (first step)

Before running checks, list the workspaces touched by the PR and confirm with the operator which checklists apply:

- `shared/` → run shared-types checks.
- `.github/` / `Makefile` / `lefthook.yml` → run devops/CI checks.
- `docs/` → run docs checks (links, sample correctness, no stale references).

Only proceed once the workspace mix is confirmed.

## Cross-workspace checklist (always run)

| Item                                                      | Required |
| --------------------------------------------------------- | -------- |
| Linked issue referenced via `Closes #<n>`                 | yes      |
| PR body fills the project PR template sections            | yes      |
| All commits follow the conventional-commits convention    | yes      |
| Branch name matches the convention for the area           | yes      |
| CI green (or explicit reason for any failing/skipped job) | yes      |
| No secrets in diff                                        | yes      |
| No `console.*` in production code                         | yes      |
| Magic numbers extracted to named constants                | yes      |
| PR under 400 lines (or scope justified)                   | yes      |

## Per-workspace addenda

**Shared (`shared/`):**

| Item                                                    | Required |
| ------------------------------------------------------- | -------- |
| Zod schemas updated; types via `z.infer`                | yes      |
| Contract test added/updated                             | yes      |
| Every consumer (`server`/`web`/`app`) still type-checks | yes      |
| No `enum` keyword introduced                            | yes      |
| Public exports go through the barrel `index.ts`         | yes      |

**DevOps / CI:**

| Item                                                             | Required    |
| ---------------------------------------------------------------- | ----------- |
| New hook / workflow has a documented bypass path for emergencies | yes         |
| Loosening a gate justified by an `E-<n>` decision                | conditional |
| Cost / vendor / secret changes referenced in commit message      | yes         |

## Output shape

For each check:

- **PASSED** — `file:line` or test name proving the check.
- **SKIPPED** — one sentence on why the check doesn't apply.
- **NOT DONE** — what is missing + required fix.

End with **APPROVED** or **CHANGES REQUESTED** + the list of NOT DONE items.

## Skills
