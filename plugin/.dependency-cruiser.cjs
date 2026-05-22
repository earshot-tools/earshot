/**
 * Dependency-cruiser config for plugin/ — Obsidian plugin entry surface.
 *
 * The plugin is bundled by esbuild (see ../esbuild.config.mjs); there is no
 * public package barrel like shared/. Tests live under src/__tests__/ and may
 * import the plugin's own entry, but we still keep the "tests use the barrel"
 * style rule to discourage deep-path drift inside src/.
 *
 * The npm `obsidian` package is types-only (its `main` field is empty — the
 * runtime is provided by the Obsidian app via esbuild externals). We override
 * the common not-to-unresolvable rule so `obsidian` imports do not trip it.
 */

const { createCruiserConfig, COMMON_RULES } = require('../tools/dependency-cruiser-base.cjs')

const PLUGIN_FORBIDDEN = [
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
  ...COMMON_RULES.map((rule) =>
    rule.name === 'not-to-unresolvable'
      ? {
          ...rule,
          to: {
            ...rule.to,
            pathNot: '^obsidian$',
          },
        }
      : rule,
  ),
]

const baseConfig = createCruiserConfig({
  projectForbidden: PLUGIN_FORBIDDEN,
  archiCollapsePattern: '^src/(__tests__)',
})

// createCruiserConfig appends COMMON_RULES after projectForbidden; we already
// merged our customised COMMON_RULES into projectForbidden, so strip the
// duplicate appended copy.
module.exports = {
  ...baseConfig,
  forbidden: PLUGIN_FORBIDDEN,
}
