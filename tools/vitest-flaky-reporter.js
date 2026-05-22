/**
 * Custom Vitest reporter that records flaky tests — any test that required
 * one or more retries to pass (or failed after retries) is written to a JSON
 * file for the post-run `scripts/check-flaky.mjs` check.
 *
 * Why a custom reporter: Vitest's built-in `json` reporter does NOT include
 * retry counts, only pass/fail status. We need retry data to enforce the
 * "no flaky tests" policy, and Vitest's internal `test.diagnostic()` surface
 * is the only place retryCount is exposed.
 *
 * This file is vanilla Node ESM with zero dependencies. It is wired into each
 * workspace's vitest config only when `CI=true`. Locally it is a no-op
 * because flaky tests must be loud at the dev's keyboard.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * @param {object} opts
 * @param {string} opts.outputFile  Absolute or relative path (resolved from cwd).
 * @param {string} opts.workspace   Workspace label (e.g., 'server', 'web').
 * @returns {object}                Vitest inline reporter with onTestRunEnd hook.
 */
export function createFlakyReporter({ outputFile, workspace }) {
  if (!outputFile) throw new Error('createFlakyReporter: outputFile is required')
  if (!workspace) throw new Error('createFlakyReporter: workspace is required')

  return {
    async onTestRunEnd(testModules) {
      const flakyTests = []

      for (const testModule of testModules) {
        const relativePath = testModule.relativeModuleId ?? testModule.moduleId ?? 'unknown'

        for (const test of testModule.children.allTests()) {
          const diagnostic = typeof test.diagnostic === 'function' ? test.diagnostic() : undefined
          const retryCount = diagnostic?.retryCount ?? 0

          if (retryCount > 0) {
            const retryOption = test.options?.retry
            const retriesAllowed =
              typeof retryOption === 'number' ? retryOption : (retryOption?.count ?? retryCount)

            flakyTests.push({
              workspace,
              file: relativePath,
              testName: test.task?.fullTestName ?? test.task?.name ?? 'unknown',
              status: test.task?.result?.state ?? 'unknown',
              retryCount,
              retriesAllowed,
              line: test.task?.location?.line ?? null,
            })
          }
        }
      }

      const resolved = path.resolve(outputFile)
      await mkdir(path.dirname(resolved), { recursive: true })
      await writeFile(
        resolved,
        `${JSON.stringify(
          {
            workspace,
            generatedAt: new Date().toISOString(),
            flakyTestCount: flakyTests.length,
            flakyTests,
          },
          null,
          2,
        )}\n`,
        'utf8',
      )
    },
  }
}
