/**
 * Shared dependency-cruiser base for every workspace.
 *
 * Each workspace's `.dependency-cruiser.cjs` provides its own project-specific
 * forbidden rules and combines them with the common rules and options exported
 * here.
 */

const COMMON_RULES = [
  {
    name: 'no-circular',
    severity: 'error',
    comment: 'Zero circular dependencies',
    from: {},
    to: { circular: true },
  },
  {
    name: 'no-orphans',
    severity: 'error',
    comment:
      'Orphan files (no imports, no importers) are usually dead code — review and delete or wire up',
    from: {
      orphan: true,
      pathNot:
        '\\.(test|spec|stories)\\.(ts|tsx|js|jsx)$|\\.d\\.ts$|^src/main\\.tsx?$|^src/App\\.tsx?$|vite-env\\.d\\.ts$|vite\\.config|vitest\\.config|tailwind\\.config|eslint\\.config|playwright\\.config|^src/i18n/',
    },
    to: {},
  },
  {
    name: 'not-to-test-from-prod',
    severity: 'error',
    comment: 'Production code must not import from test files',
    from: {
      pathNot: '\\.test\\.|\\.spec\\.|\\.stories\\.|/__tests__/|/test-utils/|/test/',
    },
    to: { path: '\\.test\\.|\\.spec\\.|/__tests__/' },
  },
  {
    name: 'no-deprecated-core',
    severity: 'error',
    comment: 'Do not import deprecated Node core modules',
    from: {},
    to: { dependencyTypes: ['deprecated'] },
  },
  {
    name: 'not-to-unresolvable',
    severity: 'error',
    comment: 'Do not import modules that cannot be resolved',
    from: {},
    to: { couldNotResolve: true },
  },
]

const COMMON_OPTIONS = {
  tsConfig: { fileName: 'tsconfig.json' },

  doNotFollow: { path: 'node_modules' },

  exclude: {
    path: '(\\.test\\.[jt]sx?$|\\.spec\\.[jt]sx?$|\\.stories\\.[jt]sx?$|/__tests__/|^dist/|^build/|^coverage/)',
  },

  enhancedResolveOptions: {
    exportsFields: ['exports'],
    conditionNames: ['import', 'require', 'node', 'default', 'browser'],
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  },
}

/**
 * Build a dependency-cruiser config from project-specific forbidden rules
 * and a project-specific archi collapse pattern.
 *
 * @param {object} opts
 * @param {Array} opts.projectForbidden - Project-specific forbidden rules
 * @param {string} opts.archiCollapsePattern - Regex for archi reporter collapse
 * @returns {object} dependency-cruiser config
 */
function createCruiserConfig({ projectForbidden = [], archiCollapsePattern }) {
  return {
    forbidden: [...projectForbidden, ...COMMON_RULES],
    options: {
      ...COMMON_OPTIONS,
      ...(archiCollapsePattern
        ? {
            reporterOptions: {
              archi: { collapsePattern: archiCollapsePattern },
            },
          }
        : {}),
    },
  }
}

module.exports = { createCruiserConfig, COMMON_RULES, COMMON_OPTIONS }
