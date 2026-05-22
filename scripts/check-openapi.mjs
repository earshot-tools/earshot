#!/usr/bin/env node
/**
 * Fail if the committed `openapi.json` drifts from what the current
 * shared/routes registry would emit. Run in CI + pre-push so the spec
 * stays in lockstep with the Zod schemas.
 *
 *   - exit 0: openapi.json matches what `buildOpenApi()` produces.
 *   - exit 1: drift (or openapi.json missing). Re-run `pnpm openapi`.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildOpenApi, OPENAPI_PATH } from './generate-openapi.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let onDisk
try {
  onDisk = readFileSync(OPENAPI_PATH, 'utf8')
} catch {
  console.error(`[check-openapi] missing openapi.json — run \`pnpm openapi\` and commit the result`)
  process.exit(1)
}

const expected = `${JSON.stringify(buildOpenApi(), null, 2)}\n`
if (onDisk !== expected) {
  console.error(`[check-openapi] ${path.relative(REPO_ROOT, OPENAPI_PATH)} is out of date`)
  console.error(`[check-openapi] run \`pnpm openapi\` and commit the result`)
  process.exit(1)
}

console.log(`[check-openapi] ${path.relative(REPO_ROOT, OPENAPI_PATH)} matches the shared registry`)
