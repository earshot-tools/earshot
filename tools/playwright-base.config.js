/**
 * Shared Playwright base config for frontend a11y/perf tests.
 *
 * Each consumer imports `defineConfig` from its own `@playwright/test`
 * dependency and passes it in.
 */

const COMMON_REPORTER_CI = [['list'], ['html', { open: 'never' }]]
const COMMON_REPORTER_LOCAL = 'list'

/**
 * Build a Playwright config for a frontend workspace.
 *
 * @param {object} opts
 * @param {Function} opts.defineConfig - The @playwright/test defineConfig function
 * @param {number} opts.port - Local port for vite preview server
 * @param {{ width: number; height: number }} opts.viewport - Test viewport
 * @param {string} opts.projectName - Playwright project name (e.g. chromium-desktop)
 * @returns {object} Playwright config (the result of defineConfig)
 */
// eslint-disable-next-line import-x/no-default-export
export function createFrontendPlaywrightConfig({ defineConfig, port, viewport, projectName }) {
  const isCI = !!process.env['CI']
  return defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,
    reporter: isCI ? COMMON_REPORTER_CI : COMMON_REPORTER_LOCAL,
    use: {
      baseURL: `http://localhost:${port}`,
      trace: 'on-first-retry',
      viewport,
    },
    projects: [
      {
        name: projectName,
        use: {
          browserName: 'chromium',
          viewport,
        },
      },
    ],
    webServer: {
      command: `pnpm exec vite preview --port ${port} --strictPort`,
      port,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  })
}
