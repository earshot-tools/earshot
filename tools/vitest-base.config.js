/**
 * Shared Vitest base config for every workspace.
 *
 * Coverage uses path-tiered thresholds mirroring asal-world's
 * `tools/vitest-base.config.js`:
 *   - `src/utils/**` (pure logic, no framework deps) gets UTILS_THRESHOLDS.
 *   - Everything else gets DEFAULT_THRESHOLDS.
 *
 * Phase-0 numbers are kept at 100/100/100/100 across both tiers because the
 * scaffolded code is trivial enough to reach 100 % and lowering pre-Phase-1
 * would be a real Ferrari-mode regression. When real plugin/native code
 * lands in Phase 1 and 100 % becomes either untestable or churny, drop
 * DEFAULT to `{ lines: 90, branches: 85, functions: 90, statements: 90 }`
 * and UTILS to `{ lines: 95, branches: 95, functions: 95, statements: 95 }`
 * per asal-world's production-tested numbers. Document the move in an ADR.
 *
 * Flaky-test tracking: CI retries failing tests twice and logs every retry
 * to a per-workspace flaky-report.json via a custom reporter. A post-run
 * script (`scripts/check-flaky.mjs`) fails the build if any test required
 * even one retry. Locally `retry: 0` so flakes fail loud.
 */

import { createFlakyReporter } from './vitest-flaky-reporter.js'

const IS_CI = process.env.CI === 'true'

const COVERAGE_REPORTERS = ['text', 'json', 'html', 'lcov']
const COVERAGE_REPORTS_DIR = './coverage'
const COVERAGE_INCLUDE = ['src/**/*.{ts,tsx}']
const COVERAGE_EXCLUDE = [
  'src/**/*.test.{ts,tsx}',
  'src/**/*.stories.tsx',
  'src/test/**',
  'src/vite-env.d.ts',
  'src/main.tsx',
]

// Phase-1 production tier values — mirror asal-world's numbers.
// Migrated from flat 100/100/100/100 in P1.0 per ADR E-008. The Obsidian
// Plugin lifecycle and Vault APIs cannot be 100%-line-covered without
// unreasonable mocking; the tiered approach is the production-tested
// asal-world pattern (their `tools/vitest-base.config.js:33-46`).
//
// To re-tighten a specific pure-logic path back to 100, pass
// `extraThresholds: { 'src/util/special/**': { lines: 100, ... } }` to
// `createVitestConfig`. Path patterns win over the wildcard.
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

/**
 * Build a Vitest config object for a workspace.
 *
 * @param {object} opts
 * @param {Array} [opts.plugins=[]] - Extra Vite plugins (e.g. @vitejs/plugin-react())
 * @param {Function} opts.defineConfig - The vitest/config defineConfig function
 * @param {string} opts.workspaceDir - Resolved absolute path to the workspace
 * @param {string} opts.workspaceName - Label used in the flaky report
 * @param {'node'|'jsdom'} [opts.environment='node']
 * @param {string[]} [opts.setupFiles=[]]
 * @param {object} [opts.extraThresholds] - Operator overrides per path pattern
 * @returns {object} Vitest config object
 */
// eslint-disable-next-line import-x/no-default-export
export function createVitestConfig({
  plugins = [],
  defineConfig,
  workspaceDir,
  workspaceName,
  environment = 'node',
  setupFiles = [],
  extraThresholds = {},
}) {
  if (!workspaceName) {
    throw new Error(
      'createVitestConfig: workspaceName is required (flaky reporter labels each workspace)',
    )
  }

  const reporters = IS_CI
    ? [
        'default',
        createFlakyReporter({
          outputFile: `${workspaceDir}/reports/flaky-report.json`,
          workspace: workspaceName,
        }),
      ]
    : ['default']

  return defineConfig({
    plugins,
    test: {
      environment,
      globals: false,
      setupFiles,
      include: ['src/**/*.test.{ts,tsx}'],
      retry: IS_CI ? 2 : 0,
      reporters,
      coverage: {
        provider: 'v8',
        all: true,
        reporter: COVERAGE_REPORTERS,
        reportsDirectory: COVERAGE_REPORTS_DIR,
        include: COVERAGE_INCLUDE,
        exclude: COVERAGE_EXCLUDE,
        thresholds: {
          'src/utils/**': UTILS_THRESHOLDS,
          ...extraThresholds,
          '*': DEFAULT_THRESHOLDS,
        },
      },
    },
    resolve: {
      alias: {
        '@': `${workspaceDir}/src`,
      },
    },
  })
}
