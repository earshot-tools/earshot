# E-007 — Add bats-core test framework for gate scripts + skill drift gate

- **Status:** accepted
- **Date:** 2026-05-22
- **Issue:** none
- **Decided by:** Inoyatov Khamidulla

## Context

After E-005 + E-006 closed nine asal-world Ferrari gate gaps, a fourth-pass
honest audit identified exactly two residual lowerings:

1. **No tests for the gate scripts themselves.** `scripts/pr-checks.sh`,
   `scripts/codebase-check.sh`, `scripts/check-inline-suppressions.mjs`,
   and `scripts/check-ai-doc-routing.mjs` contain non-trivial logic
   (regex scope tightening, recursion guards, GitHub Actions ref
   handling, conditional-marker support) and zero tests. Every bug
   fixed in those scripts during Phase 0 was caught by hand-running
   them against real diffs, never by a test. asal-world ships
   `scripts/__tests__/*.test.sh` exercising its equivalent gates;
   `bats-core` is the standard runner.

2. **No skill content-preservation gate.** `.claude/skills/*/SKILL.md`
   files are authoritative behavioural specs for AI agents. They can
   be silently corrupted by Prettier rewrites, helpful AI edits during
   sessions, or misplaced `sed` operations. Drift here is invisible to
   type-check or lint. asal-world has
   `scripts/skill-content-preservation.test.sh` for the same reason.

## Decision

### 1. Adopt bats-core as the shell-test framework

- `Brewfile` adds `bats-core` (already standard on macOS via Homebrew).
- `.github/workflows/ci.yml` adds `bats` to the Ubuntu apt install list.
- New target `make test-bats` runs everything under
  `scripts/__tests__/*.bats`.
- `make ci-local` includes `test-bats` so every push exercises the gate
  scripts before they're trusted in CI.

### 2. Test suites added (43 tests)

- `scripts/__tests__/codebase-check.bats` — 17 tests covering every
  row (S1, S3, S4, S5, S8, S8b, S9, C1, C2, C4, C7, C8) plus the
  Obsidian-entry exemption and test-file exclusion.
- `scripts/__tests__/check-inline-suppressions.bats` — 9 tests
  covering positive/negative paths, the `Allow-Suppression:` trailer
  bypass (and the mid-line non-bypass), every supported language
  pattern (.ts / .py / .swift / @ts-expect-error / # noqa /
  swiftlint:disable), and the self-reference exclusion.
- `scripts/__tests__/check-ai-doc-routing.bats` — 10 tests covering
  missing files, broken routes, conditional markers (`(when present)`,
  `(if exists)`, `(optional)`), wildcard paths, and line-limit
  enforcement.
- `scripts/__tests__/pr-checks.bats` — 10 tests covering A1/A2
  positive + negative paths, the gate-script self-recursion exclusion,
  and the local-mode A5/A11/A12 skip behaviour.

The first test run immediately caught a real bug in
`scripts/codebase-check.sh`: `xargs grep -n` drops the filename when a
single file is passed, silently breaking every per-path exclusion
(S1/S3/S4). Fixed by adding `-H` to force filename inclusion. asal-world
has the same latent bug but never hit it because their tree is large
enough that single-file invocations don't happen in practice.

### 3. Skill content-preservation gate

`scripts/check-skill-content.sh` computes a SHA-256 manifest of every
`.claude/skills/*/SKILL.md` and compares against a committed
`.claude/skills/.manifest.sha256`. Three modes:

- **`check`** (default, run by `make ci-local`): fail on drift.
- **`update`**: regenerate the manifest after an intentional edit.
- **First run / missing manifest**: write it and pass (bootstrap).

Update flow when an author intentionally edits a skill:

```bash
make skill-content-update
git add .claude/skills/.manifest.sha256
git commit -m "chore(skills): bump manifest after intentional edit"
```

Tests in `scripts/__tests__/check-skill-content.bats` cover:
first-run manifest write, no-change PASS, modification triggers DRIFT,
addition triggers DRIFT, removal triggers DRIFT, update mode regenerates,
missing `.claude/skills/` exits cleanly.

## Alternatives considered

- **shunit2 or shellspec instead of bats-core.** Rejected — asal-world
  uses raw bash test runners; bats-core is the closest standard
  framework that keeps the test syntax simple and is in Homebrew.
- **Skill content hash via git diff alone.** Rejected — git diff
  doesn't catch the case where a skill file is replaced with
  semantically-equivalent but byte-different content (whitespace
  rewrites). SHA-256 of file bytes catches every form of drift.
- **Run skill check only on `.claude/**` PRs.\*\* Rejected — corruption
  can happen on any PR via accidental formatter runs across the whole
  tree; the gate must run on every push.

## Consequences

**Easier:**

- The gate scripts now have regression tests. The next time someone
  refactors `pr-checks.sh` or `codebase-check.sh`, behaviour is locked
  in by 43 assertions.
- Skill drift fails CI immediately — no more silent corruption of
  `.claude/skills/` between commits.
- Hidden bugs (like the `xargs grep -H` issue) surface on first run,
  not three sessions later.

**Harder:**

- `make ci-local` now takes ~3 s longer (bats run across 4 suites).
- Authors editing `.claude/skills/*/SKILL.md` must remember to bump
  the manifest. Mitigated by the explicit error message naming the
  exact command to run.

**Monitor:**

- Bats coverage will need to extend as the gate scripts grow. Each
  new row in `codebase-check.sh` / `pr-checks.sh` should ship with a
  test in the same commit.

## References

- `scripts/__tests__/*.bats` — 4 suites, 43 tests.
- `scripts/check-skill-content.sh` — manifest gate.
- `Brewfile` — adds `bats-core`.
- `.github/workflows/ci.yml` — installs `bats` in CI.
- E-005 / E-006 — prior rounds of asal-world gate ports.
- asal-world `scripts/skill-content-preservation.test.sh`,
  `scripts/__tests__/*.test.sh` — sources.
