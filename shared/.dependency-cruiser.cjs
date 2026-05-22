/**
 * Dependency-cruiser config for shared/ — library mode.
 *
 * External consumers import from the package name (resolved via `exports` in
 * package.json), so the barrel is enforced by Node ESM, not depcruise. Within
 * shared/ itself, subfolders may import from sibling subfolders so the
 * barrel can compose. Tests, however, MUST import via the barrel — that's
 * the only enforcement we can do at the cruise level.
 */

const { createCruiserConfig } = require('../tools/dependency-cruiser-base.cjs')

const SHARED_RULES = [
  {
    name: 'tests-use-barrel',
    severity: 'error',
    comment:
      'Tests must import from src/index.ts (the public barrel), not deep paths. Drift in tests is drift in the public API.',
    from: { path: '^src/__tests__/' },
    to: {
      path: '^src/',
      pathNot: '^src/index\\.ts$',
    },
  },
]

module.exports = createCruiserConfig({
  projectForbidden: SHARED_RULES,
  archiCollapsePattern: '^src/(schemas|errors|routes|__tests__)',
})
