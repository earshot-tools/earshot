# E-001 — Bootstrap Earshot via the `monorepo-template` cookie-cutter

- **Status:** accepted
- **Date:** 2026-05-22
- **Issue:** none (pre-issue-tracking)
- **Decided by:** Inoyatov Khamidulla

## Context

Earshot is a greenfield Obsidian plugin + Swift helper + Python diarizer
monorepo. The same engineer also maintains `asal-world` (a larger TypeScript
monorepo) and a distilled template at `~/Projects/monorepo-template/` which
exposes a Hygen-based scaffolder. The template ships:

- pnpm workspaces with shared TypeScript config base
- ESLint (Ferrari rule set — `select=ALL` equivalents, no exclusions),
  Prettier, lefthook, lint-staged, commitlint
- GitHub Actions: `ci.yml`, `codeql.yml`, `osv-scanner.yml`, `sbom.yml`,
  `release-please.yml`
- Per-workspace dependency-cruiser, knip, jscpd
- `.claude/rules/*` and 23 baked-in skills

Hand-rolling those configs for Earshot would duplicate ~60 commits of asal-world
provenance and introduce drift risk. Doing it via the scaffolder produces the
exact same artifacts in one command.

## Decision

Bootstrap Earshot by running `monorepo-template/bin/scaffold new earshot` with
`APPS=shared LICENSE=MIT GITHUB_ORG=earshot-tools …`. Treat the scaffold output
as the source of truth for cross-cutting configs. Add Earshot-specific surfaces
(Obsidian plugin entry, Swift native helper, Python diarizer) as **additive
adapter commits** on a feature branch.

## Alternatives considered

- **Hand-roll every config.** Rejected — duplicates ~60 commits of work; high
  drift risk when asal-world / the template evolve.
- **Fork asal-world directly.** Rejected — drags Auth0/Heroku/Vercel/i18n/Drizzle
  baggage that doesn't apply to a plugin.
- **Use Obsidian's official sample-plugin template.** Rejected — minimal
  ESLint, no monorepo support, no per-workspace gates, no .claude skills.

## Consequences

**Easier:**

- The 13-gate `make ci-local` umbrella + lefthook + GitHub Actions ship for free.
- Future projects bootstrap the same way; this ADR is the reference.
- When the template improves, Earshot benefits with one re-scaffold pass.

**Harder:**

- Template drift: scaffold-generated files may need manual edits later
  (already encountered: `bin/scaffold` glob bug in `Makefile`, gitleaks-action
  v2 paid-license switch). Each drift is logged as a `fix(devops):` commit on
  the adaptation branch.
- The scaffold does not understand "Obsidian plugin" or "Swift package" as
  workspace kinds — those are added as ad-hoc adapter commits (`plugin/`,
  `native/EarshotCapture/`, `diarizer/`) following the same workspace shape.

**Monitor:**

- Periodic re-scaffold + diff to detect template changes worth backporting.
- Track `monorepo-template` git history; consider git-subtree if drift becomes
  costly to manage by hand.

## References

- Template source: `~/Projects/monorepo-template/`
- Initial scaffold env vars: see commit subject body of the bootstrap commit
- Plan: `PLAN.md` § "TOP-OF-PLAN — USE THE COOKIE CUTTER"
- Related decisions: E-002 (pnpm.overrides for transitive vulns), E-003 (STT path)
