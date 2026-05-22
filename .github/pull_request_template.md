## Linked issue

Closes #

## Why

<!-- The motivation. What problem does this solve? Reference decisions D-XXXX/E-XXXX if applicable. -->

## What

<!-- The change in 1–3 bullet points. -->

-
-

## Decisions

<!-- New decisions made during this work. Reference logged decisions or describe inline. -->

-

## Trade-offs

<!-- What trade-offs were accepted? What alternatives were rejected? -->

-

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass (where applicable)
- [ ] Manual verification done
- [ ] Screenshots attached for UI changes
- [ ] CI checks pass

## Risks

<!-- What could go wrong? Migration concerns? Rollback complexity? -->

-

## Rollback

<!-- Exact rollback command or plan. Copy-pasteable when applicable. -->

-

## Convention compliance

- [ ] No magic numbers (use named constants)
- [ ] No `console.log` in production code (use the project logger)
- [ ] No `as` type assertions in production code
- [ ] All `TODO`s reference issue numbers
- [ ] No secrets committed
- [ ] If API changed: `shared/` types and schemas updated
- [ ] PR under 400 lines (or justified)

<!-- HANDOFF v1
issue: #<issue-number>
scope:
  - <workspace/path>
  - <workspace/path>
ac-matrix:
  - id: AC1
    description: <acceptance criterion>
    evidence: <test file or manual verification reference>
self-review:
  - convention-compliance: <pass|fail|n/a>
  - codebase-check: <pass|fail|n/a>
  - pr-checks: <pass|fail|n/a>
  - ci-local: <pass|fail|n/a>
notes: |
  <optional context for the reviewer — known limitations,
  follow-ups, deferred work referenced by issue number>
-->

<!--
Required by ADR E-006. The author-reviewer contract: this PR-body block
declares scope, acceptance evidence, and self-review status. The reviewer
posts a `REVIEW-STATE v1` block in their review/comment summarising
verdict, phase results, and drift. The `pr-checks.sh` A11/A12 rows and
the GitHub workflows under `.github/workflows/handoff-check.yml` and
`.github/workflows/review-state-check.yml` enforce presence on every
non-`docs/`/`devops/`/`deps/` code PR.
-->
