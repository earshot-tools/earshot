# E-006 — Close all remaining post-E-005 Ferrari gate gaps

- **Status:** accepted
- **Date:** 2026-05-22
- **Issue:** none
- **Decided by:** Inoyatov Khamidulla

## Context

A second-pass audit after E-005 ("close 4 asal-world Ferrari gate
lowerings") identified five residual lowerings vs the asal-world
reference. Three bug-catching gate rows, one cosmetic, and one
philosophy-not-fact (coverage threshold strategy).

The five:

1. **`codebase-check.sh` S9** — `as X` type-assertion REVIEW row absent.
   ESLint catches `consistent-type-assertions: error` but not every
   pattern; the REVIEW row puts every new cast in front of a human eye.
2. **`codebase-check.sh` C7** — Zod `.parse()` vs `.safeParse()` REVIEW
   row absent. `shared/src/schemas/` already uses `HelloSchema.parse()`
   which throws on validation failure; the safer pattern is `safeParse`
   so the caller decides how to react.
3. **`pr-checks.sh` A5** — PR body accuracy REVIEW row absent. asal-world
   stubs this as a checklist row reviewers tick off; we mirror it so the
   audit table is complete.
4. **HANDOFF v1 + REVIEW-STATE v1 protocols** — asal-world's E-625 and
   E-628 require every code PR to carry a structured HANDOFF block in
   the PR body and a REVIEW-STATE block in a review/comment before
   merge. We had neither the conventions nor the gates.
5. **Coverage threshold strategy** — flat `* = 100/100/100/100` across
   both workspaces, vs asal-world's tiered structure (`src/utils/**` at
   95/95/95/95, `*` at 90/85/90/90). At Phase 0 scale 100 is achievable;
   it stops being achievable as real plugin/UI code lands.

## Decision

### 1. Add S9 + C7 rows to `scripts/codebase-check.sh`

S9 mirrors asal-world line 131; C7 mirrors line 221. Both REVIEW (not
FAIL) — they flag for human review without blocking CI. Verified
post-add: surfaced 6 `as HttpMethod` casts in `shared/src/routes/index.ts`
and 1 `HelloSchema.parse()` in `shared/src/schemas/hello.ts`. Those are
left for Phase-1 cleanup (the gate is meant to flag pre-existing
patterns for review; Phase-1 work will rewrite that code anyway).

### 2. Add A5 + A11 + A12 rows to `scripts/pr-checks.sh`

A5 is the cosmetic REVIEW stub (matches asal-world's `manual check
required`). A11 enforces presence of `<!-- HANDOFF v1` in PR body.
A12 enforces presence of `REVIEW-STATE v1` in any review or comment.
Both A11 and A12 are skipped for `docs/`, `devops/`, `deps/`, and
`dependabot/` branches.

A1/A9 gained file exclusion for the gate-defining scripts themselves
(`scripts/codebase-check.sh`, `scripts/pr-checks.sh`,
`scripts/check-inline-suppressions.mjs`) — they legitimately mention
the banned tokens as patterns, and were self-matching before the
exclusion. Same pattern asal-world uses for
`check-inline-suppressions.mjs` (it excludes itself at
`scripts/check-inline-suppressions.mjs`).

### 3. Adopt HANDOFF v1 / REVIEW-STATE v1 conventions

- `.github/pull_request_template.md` gains a HANDOFF v1 HTML-comment
  scaffold authors fill in before requesting review. Schema fields:
  `issue`, `scope`, `ac-matrix`, `self-review`, `notes`.
- `.github/workflows/handoff-check.yml` — `pull_request` event check.
  Hard-fails when the marker is absent on a non-exempt branch and the
  PR is non-draft. Soft-warns when fields are missing (author fixes
  next round; matches asal-world's "schema warn but don't block"
  trade-off in E-625).
- `.github/workflows/review-state-check.yml` — `pull_request_review` +
  `issue_comment` events. Fails on non-exempt code PRs until a review
  or comment contains the `REVIEW-STATE v1` marker. Re-evaluates on
  every event so the check turns green automatically.
- Both workflows skip `docs/`, `devops/`, `deps/`, `dependabot/`
  branches and draft PRs.

The full schema is documented inline in
`.github/pull_request_template.md` and in the workflow error messages.

### 4. Tiered coverage thresholds

`tools/vitest-base.config.js` now exports `UTILS_THRESHOLDS` and
`DEFAULT_THRESHOLDS` and applies them to `src/utils/**` and `*`
respectively (mirrors asal-world's pattern at
`tools/vitest-base.config.js:113-116`). `plugin/vitest.config.ts` and
`shared/vitest.config.ts` were duplicating the base config — they now
call `createVitestConfig()` from the base.

**Phase-0 values are kept at 100/100/100/100 for both tiers**. This is
not a lowering — the infrastructure is in place, and the values match
what was there before. When real plugin/native code lands in Phase 1
and 100 % becomes unmaintainable, drop DEFAULT to
`{ lines: 90, branches: 85, functions: 90, statements: 90 }` and UTILS
to `{ lines: 95, branches: 95, functions: 95, statements: 95 }` per
asal-world's production-tested numbers. Document the move in a
follow-up ADR.

## Alternatives considered

- **Lower DEFAULT to 90 immediately.** Rejected — there is no Phase-0
  code that justifies it; the 100 floor is achievable on scaffolded
  code. Lowering pre-emptively would be a real Ferrari regression.
- **Skip HANDOFF/REVIEW-STATE.** Rejected — they're cheap markdown
  blocks, they enforce the author-reviewer contract, and they make
  PRs machine-readable for any future automated review pipeline. The
  CI cost is one `gh api` call per event.
- **Make S9/C7 hard FAIL.** Rejected — both produce false positives
  on legitimate code patterns (`as const` is permitted; `JSON.parse`
  is permitted). REVIEW-tier is the right severity until a
  comprehensive allow-list is engineered.
- **Self-exclude only `pr-checks.sh` from A1/A9.** Rejected as
  incomplete — `codebase-check.sh` and `check-inline-suppressions.mjs`
  also self-match. The shared exclude regex covers all three.

## Consequences

**Easier:**

- Every PR has a machine-readable HANDOFF block declaring scope and
  evidence.
- Every merge is gated on a structured REVIEW-STATE block, even when
  the reviewer is the same author working through stivoo-bot.
- Tiered coverage infrastructure is in place; Phase-1 migration is
  a one-file change.
- `make pr-checks PR=N` now reports 9 rows (was 6), matching what
  reviewers expect from the asal-world pattern.

**Harder:**

- Authors must remember to fill in the HANDOFF block. Mitigated by
  the PR template scaffold.
- Reviewers must post a REVIEW-STATE block. Mitigated by the schema
  printed in the workflow error message.
- The HANDOFF workflow runs on every `pull_request` event, adding
  ~5 s of CI time per PR push (one `gh api` call).

**Monitor:**

- Schema warning (HANDOFF present but fields missing) is soft;
  promote to hard fail if authors routinely skip fields.
- The S9/C7 REVIEW rows will accumulate noise as the codebase grows.
  Tighten the regex if noise rate exceeds ~10 hits per typical PR.

## References

- E-005 — first round of asal-world gate ports (codebase-check,
  pr-checks A1/A2/A7/A8/A9/A10, ai-doc-routing, inline-suppressions
  workflow).
- E-625 — asal-world HANDOFF v1 CI enforcement.
- E-628 — asal-world REVIEW-STATE v1 CI enforcement.
- `tools/vitest-base.config.js` — tiered coverage source of truth.
- `scripts/codebase-check.sh` — adds S9 + C7.
- `scripts/pr-checks.sh` — adds A5 + A11 + A12, gate-script self-exclude.
- `.github/workflows/handoff-check.yml`,
  `.github/workflows/review-state-check.yml` — CI enforcement.
