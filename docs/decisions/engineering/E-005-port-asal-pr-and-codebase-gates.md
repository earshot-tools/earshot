# E-005 — Port asal-world PR-violation, codebase-check, and AI-doc-routing gates

- **Status:** accepted
- **Date:** 2026-05-22
- **Issue:** none
- **Decided by:** Inoyatov Khamidulla

## Context

A self-assessment at the end of Phase 0 surfaced four real quality-gate
lowerings relative to the asal-world reference project (the fifth claimed
lowering — ESLint complexity rules — was a false reading; the scaffold's
`tools/eslint-base.config.js` already spreads `COMPLEXITY_RULES`,
`SAFETY_RULES`, `SONARJS_OVERRIDE_RULES`, etc. into every workspace).

The four real lowerings:

1. **`scripts/pr-checks.sh`** — asal-world's per-PR violation audit (A1–A10)
   was absent. PRs could land containing TODO-without-issue, caret/tilde
   pins in `package.json`, dependency additions without license review,
   bundle-size changes without re-running `size-limit`, quality-gate
   wording loosenings, and doc-vs-code drift.
2. **`scripts/codebase-check.sh`** — asal-world's full-tree static analysis
   (#525) was absent. Production code could regress on `process.env`
   outside config, `console.*` outside `logger.ts`, `export default`,
   stray TODOs, direct HTTP imports, `as unknown as`, `any`, or `eval`
   without any CI catching it. The first run found two real violations
   in `plugin/src/main.ts` that were bypassed via `eslint-disable`
   comments.
3. **`scripts/check-ai-doc-routing.mjs`** — asal-world's gate verifying
   `AGENTS.md` + `docs/ai-index.md` remain authoritative and ≤200 lines
   was absent. The first run found a real broken route
   (`playwright.config.ts` referenced from `ai-index.md` but not present
   on disk).
4. **PR-review-aware inline-suppression enforcement** — E-004 documented
   that the `Allow-Suppression:` trailer is committer-controlled and
   would be tightened "when CODEOWNERS-enforced PR review labels are
   wired into a future CI gate (Phase 1+)". Phase 1 has not started, but
   the gate is cheap to add without CODEOWNERS — a workflow that runs
   `check-inline-suppressions` against the PR base ref and, when new
   suppressions are present, fails until a non-author leaves an
   `APPROVED` review.

## Decision

Port all four directly, adapted to Earshot's scope:

### `scripts/codebase-check.sh`

Mirror asal-world's S1/S3/S4/S5/S8/S8b + C1/C2/C4/C8 checks across
`plugin/src/` and `shared/src/`. Drop C5/C6/C9/C10 (PII-in-logs, sync
bcrypt, SQL string interpolation, floating promises) — server-specific
patterns that don't apply to a desktop Obsidian plugin.

S4 (`export default`) is scoped to allow `plugin/src/main.ts` and
`plugin/src/index.ts` only, because Obsidian's plugin loader requires
a default export at the entry point.

Wired into `make ci-local` so every push hits it.

### `scripts/pr-checks.sh`

Port A1, A2, A7, A8, A9, A10. Skip A3/A4 (already enforced by
`commitlint` and `branch-name-check`), A6 (already enforced by
`flaky-check`), A11/A12 (HANDOFF/REVIEW-STATE blocks are asal-world
workflow conventions; not adopted here).

Pattern-tightened A1 to source-code paths only (lint configs legitimately
define the regex that matches TODO/FIXME) and A2 to `package.json` paths
only (regex strings in JSON configs legitimately contain `"^`).

Available as `make pr-checks PR=<n|local>`. NOT in `ci-local` because
the per-commit gates (`branch-name-check`, `inline-suppressions`,
`codebase-check`) already cover the always-fail surface; `pr-checks` is
a per-PR audit that's most useful when run interactively during review.

### `scripts/check-ai-doc-routing.mjs`

Port the AGENTS.md/ai-index.md existence + line-limit checks. Extended
the route-target verification to walk every local-looking path mentioned
in `docs/ai-index.md` and verify it exists on disk, with a "(when
present)" / "(if exists)" / "(optional)" / "(where applicable)" marker
escape hatch for documented optional routes.

Wired into `make ci-local`.

### PR-review-aware inline-suppression workflow

New `.github/workflows/inline-suppressions.yml`. Runs on `pull_request`
and `pull_request_review` events. Always runs the check against the PR
base ref; if any new suppressions are found, the workflow then queries
the PR's review list via `gh api` and requires at least one `APPROVED`
review from a user other than the PR author. Self-approval explicitly
does not satisfy the gate.

This closes the gap documented in E-004 without requiring CODEOWNERS
infrastructure — the workflow runs as a required check that re-evaluates
when reviewers submit, so a PR carrying suppressions is blocked until
peer review approves.

## Alternatives considered

- **Leave the gaps unfixed.** Rejected — Ferrari mode is zero-rule-exclusion
  by default; documented gaps are debt, not policy.
- **Port asal-world's scripts verbatim.** Rejected — server-specific
  checks (bcrypt, SQL, PII logs, A11/A12 workflow blocks) are noise in
  Earshot's scope. False-positive rate would make the gates eye-roll
  bait and they'd get muted within a week.
- **Wait for CODEOWNERS-based enforcement.** Rejected — the
  `pull_request_review`-event workflow achieves the same outcome
  without needing the CODEOWNERS-label infrastructure that E-004
  predicated on.

## Consequences

**Easier:**

- Every push runs `codebase-check.sh` + `check-ai-doc-routing.mjs` —
  the static-analysis gate is now defense-in-depth on top of ESLint.
- New suppressions on a PR require a non-author approving review before
  merge (E-004's deferred limit is closed).
- `make pr-checks PR=N` gives reviewers a single command for the
  human-judgment review checklist.

**Harder:**

- One more workflow file to maintain (`inline-suppressions.yml`).
- `codebase-check.sh` will surface new violations as the codebase grows;
  the team commits to fix-not-mute as code lands.

**Monitor:**

- A9 (quality-gate weakening) is REVIEW-only — counts hits, doesn't
  fail. If false-positive rate stays high after Phase 1, scope it
  further to specific config files.
- A10 (docs-code drift) is REVIEW-only — same monitoring.
- `inline-suppressions.yml`'s requirement of a non-author approval will
  block solo work on `main`. Mitigate by branching + self-PR pattern
  with the stivoo-bot identity providing the second-person view.

## References

- `scripts/codebase-check.sh` — full-tree static analysis (ports
  asal-world #525).
- `scripts/pr-checks.sh` — per-PR audit A1/A2/A7/A8/A9/A10.
- `scripts/check-ai-doc-routing.mjs` — AGENTS.md + ai-index.md gate.
- `.github/workflows/inline-suppressions.yml` — PR-review-aware
  enforcement.
- Related decisions: E-001 (cookie-cutter), E-002 (vuln overrides),
  E-003 (STT path), E-004 (documented limits — now partially closed
  for inline suppression).
