#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.
//
// Inline-suppression review gate.
//
// Scans the diff between the merge-base and HEAD for NEW lines that introduce
// any of: `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`,
// `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `swiftlint:disable`,
// `# noqa`, `# type: ignore`, `# bandit:`, or `# pragma: no cover`.
//
// Prints any matches, grouped by file, with the diff line. Exits 1 if any are
// found. Bypass by including `[allow-suppression]` in the latest commit's
// message (subject or body) on the branch under review.
//
// Usage:
//   node scripts/check-inline-suppressions.mjs              # diff this commit against HEAD~1
//   BASE_REF=origin/main node scripts/check-inline-suppressions.mjs   # full-branch diff
//   node scripts/check-inline-suppressions.mjs <base-ref>             # explicit base

import { execSync } from 'node:child_process'
import process from 'node:process'

// Default to HEAD~1 so each commit's gate only reviews lines THAT commit added.
// CI on a PR should set BASE_REF to the PR base ref for cumulative review.
const BASE_REF = process.argv[2] ?? process.env.BASE_REF ?? 'HEAD~1'

const PATTERNS = [
  { name: 'eslint-disable', regex: /eslint-disable(?:-next-line|-line)?\b/ },
  { name: 'ts-expect-error', regex: /@ts-expect-error\b/ },
  { name: 'ts-ignore', regex: /@ts-ignore\b/ },
  { name: 'ts-nocheck', regex: /@ts-nocheck\b/ },
  { name: 'swiftlint-disable', regex: /swiftlint:disable\b/ },
  { name: 'py-noqa', regex: /#\s*noqa\b/ },
  { name: 'py-type-ignore', regex: /#\s*type:\s*ignore\b/ },
  { name: 'py-bandit', regex: /#\s*nosec\b/ },
  { name: 'py-pragma-no-cover', regex: /#\s*pragma:\s*no\s*cover\b/ },
]

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
}

function tryResolveBase() {
  try {
    sh(`git rev-parse --verify ${BASE_REF}`)
    return BASE_REF
  } catch {
    // BASE_REF doesn't exist locally — fall back to HEAD~1 if possible.
    try {
      sh('git rev-parse --verify HEAD~1')
      return 'HEAD~1'
    } catch {
      return null
    }
  }
}

const base = tryResolveBase()
if (!base) {
  console.log('check-inline-suppressions: no base ref available; skipping (likely initial commit).')
  process.exit(0)
}

const lastMsg = sh('git log -1 --format=%B').trim()
// Bypass via a Conventional-Commits-style trailer on its own line:
//   Allow-Suppression: <reason>
// Bracketed/inline mentions in prose or code fences do NOT trigger the bypass.
if (/^Allow-Suppression:\s*\S+/m.test(lastMsg)) {
  console.log(
    'check-inline-suppressions: latest commit carries Allow-Suppression trailer; gate bypassed.',
  )
  process.exit(0)
}

const diff = sh(`git diff --unified=0 ${base}...HEAD`)

// Only scan source-code paths where real disable directives live.
// Docs, configs, Makefiles legitimately mention these tokens as text.
const PATH_INCLUDES = /\.(ts|tsx|js|mjs|cjs|jsx|swift|py)$/
// Always-exclude even within source extensions (the gate's own implementation).
const PATH_EXCLUDES = [/^scripts\/check-inline-suppressions\.mjs$/]

let currentFile = null
const findings = []
for (const line of diff.split('\n')) {
  // Reset on every git diff header so binary / rename hunks don't bleed.
  if (line.startsWith('diff --git')) {
    currentFile = null
    continue
  }
  if (line.startsWith('+++ b/')) {
    currentFile = line.slice(6)
    continue
  }
  if (line.startsWith('--- ')) continue
  if (!line.startsWith('+') || line.startsWith('+++')) continue
  if (!currentFile) continue
  if (!PATH_INCLUDES.test(currentFile)) continue
  if (PATH_EXCLUDES.some((rx) => rx.test(currentFile))) continue
  const added = line.slice(1)
  for (const { name, regex } of PATTERNS) {
    if (regex.test(added)) {
      findings.push({ file: currentFile, pattern: name, line: added.trim() })
      break
    }
  }
}

if (findings.length === 0) {
  console.log(`check-inline-suppressions: no new inline suppressions in ${base}...HEAD.`)
  process.exit(0)
}

console.error(
  `check-inline-suppressions: found ${findings.length} new inline suppression(s) since ${base}.`,
)
console.error(
  'Each requires a reviewer ack. To bypass, add an `Allow-Suppression: <reason>` trailer line to the commit msg.',
)
console.error('')
const byFile = new Map()
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, [])
  byFile.get(f.file).push(f)
}
for (const [file, hits] of byFile) {
  console.error(`  ${file}:`)
  for (const h of hits) console.error(`    [${h.pattern}] ${h.line}`)
}
process.exit(1)
