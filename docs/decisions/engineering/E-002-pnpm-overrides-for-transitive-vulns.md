# E-002 — Patch transitive CVEs via `pnpm.overrides` (no audit-level lowering)

- **Status:** accepted
- **Date:** 2026-05-22
- **Issue:** none
- **Decided by:** Inoyatov Khamidulla

## Context

The freshly-scaffolded Earshot repository failed `make ci-local`'s `audit` gate
with 14 transitive vulnerabilities in dev dependencies the scaffold pulls in
(vitest critical, lodash + stryker-util high, plus 11 moderate).

Direct deps could not be upgraded without forking the template (vitest 2.1.4
→ 3.x is a major bump; lodash and ajv are pulled in by ESLint, stryker, vite).
The Ferrari posture explicitly forbids lowering `--audit-level` or adding
audit ignores.

## Decision

Add `pnpm.overrides` in the root `package.json` forcing each vulnerable
transitive package to the patched version line. Where the patched version
breaks a consumer (notably `ajv` 8.18+ breaks `@eslint/eslintrc` which still
expects ajv 6.x), use **path-scoped overrides** so only the vulnerable
sub-tree is bumped:

```json
"@stryker-mutator/core>ajv": ">=8.18.0"
```

Each override pins to a range, not an exact version, so dependabot/renovate
can still pull in higher patched releases without further config changes.

## Alternatives considered

- **Lower `--audit-level`** (e.g., to `high` or `critical`). Rejected —
  contradicts Ferrari "no exclusions" + lets moderate-severity CVEs ship.
- **Audit ignores** via `--audit-ignore` or a `.npm-audit-ignore` file.
  Rejected — same reason; also gives no signal when the ignore goes stale.
- **Major upgrade vitest 2.x → 3.x.** Forced anyway (the patched line is
  3.x); same for vite 6.x. Did not break the scaffold's vitest config.
- **Fork `monorepo-template` to refresh its pinned versions.** Slower path;
  Earshot would have to track the template fork. The overrides keep Earshot
  trackable against the upstream template.
- **Drop the vulnerable tools entirely** (e.g., remove stryker until needed).
  Considered but rejected — Ferrari posture wants mutation testing surface
  in place from day 1.

## Consequences

**Easier:**

- Single `audit` gate stays green at default (low) audit level.
- Each override is one line; future audits surface NEW vulns, not old
  noise.

**Harder:**

- Overrides have to be reviewed when refreshing the lockfile — a passing
  override may be silently superseded by a newer patched release that
  introduces another break.
- Mixed vitest versions are a known footgun (vitest 2.x ↔ vite 5.x vs
  vitest 3.x ↔ vite 6.x). We chose the 3.x line; if a downstream package
  ever needs vitest 2.x at runtime (not just for typing), the override
  graph needs revisiting.

**Monitor:**

- `pnpm audit` in `make ci-local` runs every commit; a new transitive vuln
  will surface immediately.
- Each override should be removed when the upstream direct dep moves past
  the vulnerable transitive — track via `pnpm why <pkg>` after dep refreshes.

## References

- Initial overrides set: bootstrap commit
- Plan: `PLAN.md` § "TOP-OF-PLAN — USE THE COOKIE CUTTER"
- Related decisions: E-001 (cookie-cutter origin)
