# E-008 — Migrate coverage thresholds from flat 100 to asal-world tiers (UTILS=95 / DEFAULT=90)

- **Status:** accepted
- **Date:** 2026-05-22
- **Issue:** #4
- **Decided by:** Inoyatov Khamidulla

## Context

Phase 0 set both `UTILS_THRESHOLDS` and `DEFAULT_THRESHOLDS` in
`tools/vitest-base.config.js` to `100/100/100/100`. The infrastructure for
path-tiered thresholds was adopted in E-006, but the numbers were left
high because Phase-0 code was trivial (scaffolded hello-world tests
naturally hit 100%).

Phase 1 introduces the first non-trivial production code:

- `src/main.ts` — Obsidian `Plugin` subclass with `onload` / `onunload`
  / `loadData` / `saveData` / command registration. Obsidian's `Plugin`
  base class is partially mockable but not fully; some lifecycle code
  paths (the `addCommand` callback contexts, `addStatusBarItem` DOM
  attachment) cannot be exercised without booting Obsidian itself.
- `src/notes/MeetingNoteWriter.ts` — calls Vault APIs whose error
  paths are inherently I/O. We can mock the success path cleanly; the
  error paths require fault injection that often costs more LOC than
  the production code.

Holding the 100% floor forces one of three outcomes, all bad:

1. Over-mocking: spending 3× the LOC on mocks to reach 100% on code
   whose only escape from the framework is the framework itself.
2. Coverage cheats: `/* istanbul ignore */` comments scattered through
   the codebase, silently weakening the gate worse than a lower
   threshold would.
3. Reactive churn: tests that exist solely to bump coverage by 1%,
   adding no behavioural assertion.

asal-world already hit this wall and settled on the tiered pattern:
`src/utils/**` at 95/95/95/95 (pure logic with no framework deps) and
everything else at 90/85/90/90. Both numbers are battle-tested across
their server/, game/, and web/ workspaces.

## Decision

Set the Phase-1+ values in `tools/vitest-base.config.js` to match
asal-world's:

```js
export const UTILS_THRESHOLDS = {
  lines: 95,
  branches: 95,
  functions: 95,
  statements: 95,
}

export const DEFAULT_THRESHOLDS = {
  lines: 90,
  branches: 85,
  functions: 90,
  statements: 90,
}
```

`src/utils/**` (path glob applied first in the `thresholds:` map) hits
the 95 tier. Everything else hits the 90/85/90/90 tier. Workspaces can
still pass `extraThresholds` to lift specific paths back to 100 when
they're pure logic — the wildcard pattern wins last so explicit overrides
take precedence.

This migration lands as P1.0 — the first commit on Phase 1's branch,
before any feature code. That sequencing means every Phase-1 test
target is measured against the realistic ceiling from day one rather
than inheriting an inflated baseline.

## Alternatives considered

- **Keep flat 100.** Rejected — produces the over-mocking / coverage
  cheat / churn trio above. Phase 0 stayed at 100 only because no
  framework-bound code existed; that changes with the first
  `Plugin` subclass.
- **Drop to flat 90.** Rejected — pure-logic utility code (e.g., time
  formatting, path sanitization, multipart construction) can and should
  reach 95+. A flat 90 leaves an entire class of bugs uncaught.
- **Per-file overrides instead of the tier glob.** Rejected — too noisy
  to maintain. The glob captures the architectural distinction
  (framework-bound vs pure logic) in one place.
- **Lower DEFAULT to 80.** Rejected — asal-world tested 90/85 in
  production; no reason to go softer without evidence we need to.

## Consequences

**Easier:**

- Phase 1+ tests can be honest about what they cover. Mocks are written
  for behavioural assertions, not coverage bumps.
- New util-tier code lands with a real 95% gate that catches genuine
  logic gaps.
- The path-tier wildcard means a new pure-logic file under `src/utils/`
  automatically gets the stricter threshold without per-file config.

**Harder:**

- The 100% floor that Phase-0 tests passed under is gone. If a Phase-1
  test accidentally drops a workspace below 90/85/90/90, CI fails —
  same Ferrari posture, lower numbers.
- A file that legitimately needs to be at 100 must lift itself via
  `extraThresholds` in its workspace's `vitest.config.ts` AND justify
  the override in its commit message. Friction is intentional.

**Monitor:**

- If multiple Phase-1 files end up lifting to 100 via `extraThresholds`,
  the 95/90 tiering may be too coarse — split into a third tier
  (`src/util-strict/**` at 100, `src/util/**` at 95). Revisit at
  Phase-1 close.
- If branch coverage at 85 admits real branch-logic gaps in Phase 1
  code, tighten DEFAULT branches to 90.

## References

- `tools/vitest-base.config.js` — the constants migrated here.
- E-006 — original adoption of the tier infrastructure at flat 100.
- asal-world `tools/vitest-base.config.js:33-46` — source of the
  tested 95/90 numbers.
