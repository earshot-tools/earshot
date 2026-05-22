/**
 * Dependency-cruiser config for plugin/ — Obsidian plugin entry surface.
 *
 * The plugin is bundled by esbuild (see ../esbuild.config.mjs); there is no
 * public package barrel like shared/. Tests live under src/__tests__/ and may
 * import the plugin's own entry, but we still keep the "tests use the barrel"
 * style rule to discourage deep-path drift inside src/.
 */

const { createCruiserConfig } = require('../tools/dependency-cruiser-base.cjs')

const PLUGIN_RULES = [
  {
    name: 'tests-use-barrel',
    severity: 'error',
    comment:
      'Tests must import from src/index.ts or src/main.ts (the entry surface), not deep paths into other modules.',
    from: { path: '^src/__tests__/' },
    to: {
      path: '^src/',
      pathNot: '^src/(index|main)\\.ts$',
    },
  },
]

module.exports = createCruiserConfig({
  projectForbidden: PLUGIN_RULES,
  archiCollapsePattern: '^src/(__tests__)',
})
