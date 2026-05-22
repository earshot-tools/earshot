/**
 * Shared Vite config helpers for every frontend workspace.
 *
 * Each consumer imports vite, @vitejs/plugin-react, etc. from its own
 * node_modules and calls these helpers to assemble its config.
 */

const SENTRY_ORG = 'earshot-tools'

/**
 * Build the sentry-vite-plugin options for a given Sentry project name.
 * The plugin is disabled if SENTRY_AUTH_TOKEN is not set (local dev).
 */
export function createSentryConfig(sentryProject) {
  return {
    org: SENTRY_ORG,
    project: sentryProject,
    sourcemaps: {
      filesToDeleteAfterUpload: ['./dist/**/*.map'],
    },
    disable: !process.env.SENTRY_AUTH_TOKEN,
  }
}

/**
 * Build the `build` block — emits hidden sourcemaps when Sentry is configured,
 * none otherwise (so we never ship sourcemaps publicly).
 */
export function createBuildConfig() {
  return {
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? 'hidden' : false,
  }
}

/**
 * Build the `resolve.alias` block — maps the standard `@/` import alias to
 * `<workspace>/src`.
 */
export function createAliases(workspaceDir) {
  return {
    '@': `${workspaceDir}/src`,
  }
}
