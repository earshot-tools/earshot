#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Inoyatov Khamidulla and contributors.
#
# Full-tree static analysis for Earshot production code. Ported from
# asal-world `scripts/codebase-check.sh` (#525) with the server/SQL/bcrypt
# checks dropped (not applicable — no DB, no auth code in Earshot) and the
# `export default` rule scoped to allow Obsidian's plugin entry point.
#
# Usage:
#   scripts/codebase-check.sh                # default: plugin/src + shared/src
#   scripts/codebase-check.sh plugin/src     # single workspace
#   scripts/codebase-check.sh dir1 dir2 ...  # multiple
#
# Exits 0 if all PASS, 1 on any FAIL.

set -euo pipefail

FAIL_COUNT=0
TOTAL_COUNT=0

if [ "$#" -gt 0 ]; then
  TARGETS=("$@")
else
  TARGETS=("plugin/src" "shared/src")
fi

count_lines() {
  local input="$1"
  if [ -z "$input" ]; then echo 0; return; fi
  echo "$input" | grep -c . 2>/dev/null || echo 0
}

row() {
  local id="$1" name="$2" verdict="$3" evidence="$4"
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  if [ "$verdict" = "FAIL" ]; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  printf "| %-4s | %-48s | %-7s | %s |\n" "$id" "$name" "$verdict" "$evidence"
}

# Find production .ts/.tsx files across all TARGETS.
# Excludes: tests, fixtures, build outputs, type-only declaration files.
prod_files() {
  for t in "${TARGETS[@]}"; do
    [ -d "$t" ] || continue
    find "$t" -type f \( -name '*.ts' -o -name '*.tsx' \) \
      ! -name '*.test.ts' \
      ! -name '*.test.tsx' \
      ! -name '*.spec.ts' \
      ! -name '*.property.test.ts' \
      ! -name '*.d.ts' \
      ! -path '*/__tests__/*' \
      ! -path '*/test-helpers*' \
      ! -path '*/test-factory*' \
      ! -path '*/fixtures/*' \
      ! -path '*/dist/*' \
      ! -path '*/node_modules/*' \
      2>/dev/null
  done
}

prod_grep() {
  local pattern="$1"
  shift
  local files
  files=$(prod_files)
  if [ -z "$files" ]; then return 0; fi
  echo "$files" | xargs grep -nE "$pattern" "$@" 2>/dev/null || true
}

PROD_COUNT=$(prod_files | wc -l | tr -d ' ')
echo "## Codebase Static Analysis — ${TARGETS[*]}"
echo ""
echo "Production files scanned: ${PROD_COUNT}"
echo ""
echo "| #    | Check                                            | Verdict | Evidence |"
echo "|------|--------------------------------------------------|---------|----------|"

# S1: process.env outside config.ts (convention 7).
hits=$(prod_grep "process\.env" | grep -Ev "(/|^)config\.ts:" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "S1" "process.env outside config.ts" "FAIL" "${count} hits in: ${files}"
else
  row "S1" "process.env outside config.ts" "PASS" "0 hits"
fi

# S3: console.* outside logger.ts (convention 8).
hits=$(prod_grep "console\.(log|error|warn|debug|info)" | grep -Ev "(/|^)logger\.ts:" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "S3" "console.* in production code" "FAIL" "${count} hits in: ${files}"
else
  row "S3" "console.* in production code" "PASS" "0 hits"
fi

# S4: export default.
# Earshot exemption: plugin/src/main.ts and plugin/src/index.ts must use
# `export default` — Obsidian's Plugin loader requires it. Anywhere else
# fails (matches asal-world's strict no-default-export policy).
hits=$(prod_grep "^export default" \
  | grep -Ev "(^|/)plugin/src/main\.ts:" \
  | grep -Ev "(^|/)plugin/src/index\.ts:" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "S4" "export default outside obsidian entry" "FAIL" "${count} hits in: ${files}"
else
  row "S4" "export default outside obsidian entry" "PASS" "0 hits"
fi

# S5: TODO/FIXME without issue number (convention 11).
hits=$(prod_grep "TODO|FIXME" | grep -iv "#[0-9]" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "S5" "TODO/FIXME without issue number" "FAIL" "${count} hits in: ${files}"
else
  row "S5" "TODO/FIXME without issue number" "PASS" "0 hits"
fi

# S8: direct HTTP client imports (SSRF surface; convention 79).
# safeFetch wrapper lives at plugin/src/util/safeFetch.ts (planned). Until
# that file exists the rule is effectively "no HTTP imports at all" — fine.
hits=$(prod_grep "from ['\"]axios|from ['\"]undici|from ['\"]got|from ['\"]node-fetch|from ['\"]node:https|from ['\"]node:http" \
  | grep -v "safeFetch\|safe-fetch" \
  | grep -v "import type" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "S8" "direct HTTP client imports (SSRF)" "FAIL" "${count} hits in: ${files}"
else
  row "S8" "direct HTTP client imports (SSRF)" "PASS" "0 hits"
fi

# S8b: bare fetch() outside safeFetch.
hits=$(prod_grep "\bfetch\s*\(" | grep -v "safeFetch\|safe-fetch" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "S8b" "bare fetch() outside safeFetch" "FAIL" "${count} hits in: ${files}"
else
  row "S8b" "bare fetch() outside safeFetch" "PASS" "0 hits"
fi

# C1: as unknown as (unsafe cast pattern).
hits=$(prod_grep "as unknown as" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "C1" "as unknown as (unsafe cast)" "FAIL" "${count} hits in: ${files}"
else
  row "C1" "as unknown as (unsafe cast)" "PASS" "0 hits"
fi

# C2: any type in production.
hits=$(prod_grep ": any\b|<any>|as any\b" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "C2" "any type in production code" "FAIL" "${count} hits in: ${files}"
else
  row "C2" "any type in production code" "PASS" "0 hits"
fi

# C4: eval / new Function / dangerouslySetInnerHTML.
hits=$(prod_grep "dangerouslySetInnerHTML|\beval\(|new Function\(" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "C4" "eval / dangerouslySetInnerHTML / new Function" "FAIL" "${count} hits in: ${files}"
else
  row "C4" "eval / dangerouslySetInnerHTML / new Function" "PASS" "0 hits"
fi

# C8: hardcoded secrets / api keys / passwords.
hits=$(prod_grep "secret.*=.*['\"][A-Za-z0-9_-]{8,}|password.*=.*['\"][A-Za-z0-9_-]{8,}|apiKey.*=.*['\"][A-Za-z0-9_-]{8,}|api_key.*=.*['\"][A-Za-z0-9_-]{8,}" \
  | grep -v "config\.\|process\.env\|// \|test\|example\|placeholder\|\.d\.ts" || true)
count=$(count_lines "$hits")
if [ "$count" -gt 0 ]; then
  files=$(echo "$hits" | cut -d: -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')
  row "C8" "possible hardcoded secrets" "FAIL" "${count} hits in: ${files}"
else
  row "C8" "possible hardcoded secrets" "PASS" "0 hits"
fi

echo ""
echo "**Total: ${TOTAL_COUNT} checks | FAIL: ${FAIL_COUNT}**"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo ""
  echo "Run individual greps to see exact file:line for each violation."
  exit 1
fi
