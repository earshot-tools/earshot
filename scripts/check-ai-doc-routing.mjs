#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.
//
// AI documentation routing gate. Ported from asal-world
// `scripts/check-ai-doc-routing.mjs` and adapted to Earshot's docs layout.
//
// Enforces:
// 1. AGENTS.md exists at repo root (entry point for any Agent role).
// 2. docs/ai-index.md exists and stays ≤ 200 lines so startup routing
//    fits in a single read for cold-context agents.
// 3. Each routing target referenced from docs/ai-index.md actually exists.
//
// Exits 1 if any check fails.

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.env.AI_DOC_ROUTING_ROOT
  ? path.resolve(process.env.AI_DOC_ROUTING_ROOT)
  : process.cwd()

const failures = []

function fail(message) {
  failures.push(message)
}

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(
      `${relativePath} is missing. Restore the file or update the AI routing check if the authoritative path changed.`,
    )
    return null
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function countLines(text) {
  if (text.length === 0) return 0
  return text.endsWith('\n') ? text.slice(0, -1).split('\n').length : text.split('\n').length
}

function checkLineLimit(relativePath, text, maxLines) {
  const lineCount = countLines(text)
  if (lineCount > maxLines) {
    fail(
      `${relativePath} has ${lineCount} lines; keep it under or equal to ${maxLines} so startup routing stays small.`,
    )
  }
}

// Extract markdown links / inline-code paths that look like local files.
// Returns {path, conditional} tuples — `conditional` is true if the source
// line contains a "(when present)" / "(if exists)" / "(optional)" marker
// (these are intentional documentation hints, not hard route guarantees).
const CONDITIONAL_RE = /\((?:when present|if exists|optional|where applicable)\)/i

function extractLocalPaths(markdown) {
  const out = new Map()
  for (const line of markdown.split('\n')) {
    const conditional = CONDITIONAL_RE.test(line)
    for (const match of line.matchAll(/`([^`\n]+\.(?:md|json|js|ts|mjs|cjs|yml|yaml))`/g)) {
      if (!out.has(match[1])) out.set(match[1], conditional)
    }
    for (const match of line.matchAll(/\]\((?!https?:)([^)\s]+)\)/g)) {
      if (!out.has(match[1])) out.set(match[1], conditional)
    }
  }
  return [...out.entries()]
}

const agents = readRequired('AGENTS.md')
const aiIndex = readRequired('docs/ai-index.md')

if (aiIndex) {
  checkLineLimit('docs/ai-index.md', aiIndex, 200)

  // Verify every local-looking path mentioned in ai-index.md exists.
  // Glob-like wildcards (`*`, `**`) are skipped — they are intentional
  // catch-alls (e.g., `docs/decisions/engineering/`). Paths marked with
  // "(when present)" / "(if exists)" are skipped — they document optional
  // routes that materialize later in the project.
  for (const [target, conditional] of extractLocalPaths(aiIndex)) {
    if (target.includes('*')) continue
    if (conditional) continue
    const cleaned = target.replace(/^\.\//, '')
    const absolute = path.join(root, cleaned)
    if (!fs.existsSync(absolute)) {
      fail(
        `docs/ai-index.md references ${target} but it does not exist on disk. Update the route or restore the file.`,
      )
    }
  }
}

if (agents) {
  checkLineLimit('AGENTS.md', agents, 200)
}

if (failures.length > 0) {
  console.error('AI documentation routing check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('AI documentation routing check passed.')
