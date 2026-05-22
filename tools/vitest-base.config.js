/**
 * Shared Vitest base config for every workspace.
 *
 * Coverage thresholds default to 100/100/100/100 (lines, functions, branches,
 * statements). If a hello-world or real change drops below 100 %, add the
 * test — do NOT lower the threshold. Strict mode rule.
 *
 * Flaky test tracking: in CI we retry failing tests twice and log every retry
 * to a per-workspace flaky-report.json via a custom reporter. A post-run
 * script (`scripts/check-flaky.mjs`) fails the build if any test required even
 * one retry. Locally `retry: 0` so flakes fail loud.
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

const STRICT_THRESHOLDS = {
  lines: 100,
  branches: 100,
  functions: 100,
  statements: 100,
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
          ...extraThresholds,
          '*': STRICT_THRESHOLDS,
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
