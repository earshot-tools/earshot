#!/usr/bin/env node
/**
 * Post-test flaky-test gate.
 *
 * Scans each workspace's reports/flaky-report*.json files (written by the
 * custom Vitest reporter in `tools/vitest-flaky-reporter.js` when CI=true)
 * and fails the build if any test required even one retry to pass. No
 * thresholds, no allowlist: a flaky test is a bug.
 *
 * Vanilla Node ESM, zero npm dependencies. Resolves report paths from the
 * repo root regardless of cwd.
 *
 * Exit codes:
 *   0 — no flaky tests (or no reports found, which is allowed: a workspace
 *       may not have been touched by the PR and thus its test job did not run)
 *   1 — one or more flaky tests detected
 *   2 — could not parse a report file
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

const WORKSPACES = ['plugin', 'shared']
const REPORTS_DIR = 'reports'
const REPORT_PREFIX = 'flaky-report'
const REPORT_SUFFIX = '.json'

function reportPathsForWorkspace(workspace) {
  const reportsDir = path.join(REPO_ROOT, workspace, REPORTS_DIR)
  if (!existsSync(reportsDir)) return []
  return readdirSync(reportsDir)
    .filter((entry) => entry.startsWith(REPORT_PREFIX) && entry.endsWith(REPORT_SUFFIX))
    .map((entry) => path.join(reportsDir, entry))
    .sort()
}

function loadReport(workspace, reportPath) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(reportPath, 'utf8'))
  } catch (err) {
    console.error(`[flaky-check] ERROR: could not parse ${reportPath}: ${err.message}`)
    process.exit(2)
  }
  const flakyTests = Array.isArray(parsed.flakyTests) ? parsed.flakyTests : []
  return { workspace, reportPath, flakyTests }
}

const reportsByWorkspace = WORKSPACES.map((workspace) => ({
  workspace,
  reports: reportPathsForWorkspace(workspace).map((reportPath) =>
    loadReport(workspace, reportPath),
  ),
}))

const scannedReports = reportsByWorkspace.flatMap((result) => result.reports)
const allFlaky = scannedReports.flatMap((report) =>
  report.flakyTests.map((test) => ({ ...test, workspace: test.workspace ?? report.workspace })),
)

console.log('[flaky-check] Scanning workspaces:')
for (const result of reportsByWorkspace) {
  if (result.reports.length > 0) {
    for (const report of result.reports) {
      console.log(
        `  - ${result.workspace}: ${report.flakyTests.length} flaky test(s) in ${path.relative(REPO_ROOT, report.reportPath)}`,
      )
    }
  } else {
    console.log(`  - ${result.workspace}: no report (workspace not tested in this run)`)
  }
}

if (allFlaky.length === 0) {
  console.log(
    `\n[flaky-check] OK — no flaky tests detected across ${scannedReports.length} report(s).`,
  )
  process.exit(0)
}

console.error('\n[flaky-check] FAIL — flaky tests detected:\n')
for (const test of allFlaky) {
  const location = test.line != null ? `:${test.line}` : ''
  console.error(
    `  ${test.workspace} > ${test.file}${location} > ${test.testName} (retried ${test.retryCount}x of ${test.retriesAllowed} allowed, final status: ${test.status})`,
  )
}
console.error(
  `\n[flaky-check] Total flaky tests: ${allFlaky.length}. A flaky test is a bug, not a quirk.`,
)
console.error('[flaky-check] Fix the root cause of the non-determinism. Do not add a retry loop.')
process.exit(1)
