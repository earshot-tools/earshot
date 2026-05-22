#!/usr/bin/env node
/**
 * Print the GitHub Actions job names that should be set as required status
 * checks on `main`. Source of truth = `.github/workflows/*.yml`. Reading the
 * job NAMES (not ids) because that's what GitHub branch-protection matches on.
 *
 * Used by `make repo-init` so the required-checks list stays in lockstep with
 * whatever CI we actually run. No yaml dep — minimal scan of `name:` lines
 * under `jobs.`. If a job has no `name:`, we fall back to the job id.
 *
 * Usage: node scripts/required-checks.mjs        → prints one name per line
 *        node scripts/required-checks.mjs --gh   → gh-api -F flags for branch protection
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORKFLOWS_DIR = path.join(REPO_ROOT, '.github/workflows')

const SKIP_WORKFLOWS = new Set(['release-please.yml', 'sbom.yml'])

function collectJobs(yaml) {
  // Tiny line-scanner: when we're under `jobs:`, the next 2-indented keys are
  // job ids. Inside each job, `name: …` overrides the id for status-check
  // matching.
  const out = []
  const lines = yaml.split('\n')
  let inJobs = false
  let currentId = null
  let currentName = null
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true
      continue
    }
    if (!inJobs) continue
    const idMatch = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/)
    if (idMatch) {
      if (currentId) out.push({ id: currentId, name: currentName ?? currentId })
      currentId = idMatch[1]
      currentName = null
      continue
    }
    const nameMatch = line.match(/^ {4}name:\s+(.+?)\s*$/)
    if (nameMatch && currentId) {
      currentName = nameMatch[1].replace(/^['"]|['"]$/g, '')
    }
  }
  if (currentId) out.push({ id: currentId, name: currentName ?? currentId })
  return out
}

if (!existsSync(WORKFLOWS_DIR)) {
  process.exit(0)
}

const checks = new Set()
for (const file of readdirSync(WORKFLOWS_DIR)) {
  if (!file.endsWith('.yml') || SKIP_WORKFLOWS.has(file)) continue
  const body = readFileSync(path.join(WORKFLOWS_DIR, file), 'utf8')
  for (const { name } of collectJobs(body)) checks.add(name)
}

const sorted = [...checks].sort()
const flag = process.argv[2]
if (flag === '--gh') {
  for (const c of sorted) {
    process.stdout.write(`-f 'required_status_checks[contexts][]=${c}' `)
  }
  process.stdout.write('\n')
} else {
  for (const c of sorted) {
    console.log(c)
  }
}
