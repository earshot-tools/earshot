# E-004 — Inline-suppression review and shared/ Stryker score are documented limits, not silent gaps

- **Status:** partially superseded by E-005 (2026-05-22) — the
  inline-suppression PR-review gap is now enforced by
  `.github/workflows/inline-suppressions.yml`. shared/ Stryker score
  remains a documented limit.
- **Date:** 2026-05-22
- **Issue:** none
- **Decided by:** Inoyatov Khamidulla

## Context

Two quality-gate areas are demonstrably weaker than the asal-world reference
project and should be acknowledged rather than papered over:

1. **Inline-suppression bypass is committer-controlled.** The
   `Allow-Suppression: <reason>` trailer is checked by
   `scripts/check-inline-suppressions.mjs`. Anyone with commit access can add
   the trailer themselves; there is no programmatic second-person check. In
   contrast, asal-world's CI requires `@inoyatov` approval before a PR with
   inline suppressions can merge.

2. **`make stryker-shared` mutation score is 19.35%, below the 80% break
   threshold.** Stryker has been verified working (plugin/ scores 100%), but
   the `shared/` workspace's mutation score is low because the workspace
   ships scaffolded example tests (`hello.test.ts`, `routes.test.ts`,
   `contract.test.ts`, etc.) that exercise the API surface but don't kill
   most mutations. These tests came from `monorepo-template` and were never
   written for Earshot's actual code.

## Decision

For (1):

- Keep the `Allow-Suppression:` trailer as the local-gate bypass.
- Add an **out-of-band convention**: any commit landing on `main` with new
  inline suppressions MUST have an approving PR review from a different
  identity than the commit author. The review check is performed manually
  by the PR reviewer reading the diff; the script provides the inventory
  via `make inline-suppressions`.
- Document the limit here; revisit when CODEOWNERS-enforced PR review labels
  are wired into a future CI gate (Phase 1+).

For (2):

- Split `make stryker` into `stryker-plugin` and `stryker-shared`.
- `stryker-plugin` runs as a label-gated CI job (see
  `.github/workflows/stryker.yml` when added).
- `stryker-shared` is exercised locally but not run in CI because the
  scaffolded shared/ tests score below threshold.
- The shared/ mutation score will improve when shared/ accumulates real
  Earshot code (Phase 2+: notes/, util/, stt/). At that point the gate
  becomes meaningful.
- Do NOT lower the 80% break threshold to mask the gap.

## Alternatives considered

For (1):

- **GitHub Actions `pull_request_review` event + CODEOWNERS check.** The
  right long-term solution. Requires Actions write permission + a non-trivial
  workflow. Deferred — Phase 1.
- **Require the trailer to name a different GitHub handle than the committer.**
  Approximates "second-person" but trivially gamed (any string can be used).
  Rejected.
- **Disallow inline suppressions entirely.** Impractical — the plugin's
  `EarshotPlugin extends Plugin` necessarily uses `export default` which
  trips `import-x/no-default-export`. Six suppressions in P0.S1 are
  load-bearing.

For (2):

- **Lower the break threshold to 15%.** Rejected — Ferrari "no exclusions".
- **Remove shared/ scaffolded tests.** Rejected — they exercise real Zod
  schemas + Problem Details errors that future code will depend on.
- **Skip stryker entirely.** Rejected — plugin/ at 100% mutation score is
  worth keeping in the gate matrix.

## Consequences

**Easier:**

- Both limits are visible (this ADR) rather than silent.
- `make stryker-plugin` provides a real gate on the most important workspace.
- The inline-suppression script catches NEW suppressions at the per-commit
  level (HEAD~1..HEAD default), forcing intent on every commit.

**Harder:**

- Until the GitHub-API-based reviewer ack lands, the inline-suppression gate
  is "soft" — relies on human review discipline.
- `make stryker-shared` will fail until shared/ tests improve; the
  Makefile target exists but is not in `ci-local` and not in CI.
- New contributors may not know to look at the inline-suppression output
  when reviewing PRs.

**Monitor:**

- shared/ mutation score should increase as real code lands in shared/
  (PLAN.md Phases 2+).
- Re-evaluate (1) when a PR-review-aware gate becomes feasible.

## References

- `scripts/check-inline-suppressions.mjs` — the gate implementation.
- `plugin/stryker.config.json`, `shared/stryker.config.json` — workspace configs.
- Related decisions: E-001 (cookie-cutter), E-002 (vuln overrides), E-003 (STT path).
