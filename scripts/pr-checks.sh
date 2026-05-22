#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Inoyatov Khamidulla and contributors.
#
# PR violation checks — Phase-2 automated checks ported from asal-world
# `scripts/pr-checks.sh` (#523). Scope reduced to what applies to Earshot:
# A1 (TODO/FIXME), A2 (caret/tilde), A7 (license REVIEW on new deps),
# A8 (bundle delta REVIEW), A9 (quality-gate weakening), A10 (docs-code
# drift).
#
# Skipped vs asal-world:
#  - A3/A4 — already enforced by commitlint + branch-name-check.sh in CI.
#  - A6 — already enforced by flaky-check Make target.
#  - A11/A12 — HANDOFF/REVIEW-STATE workflow conventions; not adopted here.
#
# Usage:
#   scripts/pr-checks.sh <PR_NUMBER>     # against a real PR via `gh pr diff`
#   scripts/pr-checks.sh local           # against the current branch vs main
#
# Exits 0 if no FAIL rows, 1 otherwise. REVIEW rows do not fail.

set -euo pipefail

PR="${1:?Usage: pr-checks.sh <PR_NUMBER|local>}"
DIFF_CACHE=""
NAMES_CACHE=""
FAIL_COUNT=0
TOTAL_COUNT=0

get_diff() {
  if [ -z "$DIFF_CACHE" ]; then
    if [ "$PR" = "local" ]; then
      DIFF_CACHE=$(git diff "origin/main...HEAD")
    else
      DIFF_CACHE=$(gh pr diff "$PR" 2>/dev/null) \
        || { echo "ERROR: cannot fetch PR diff" >&2; exit 2; }
    fi
  fi
  echo "$DIFF_CACHE"
}

get_names() {
  if [ -z "$NAMES_CACHE" ]; then
    if [ "$PR" = "local" ]; then
      NAMES_CACHE=$(git diff --name-only "origin/main...HEAD")
    else
      NAMES_CACHE=$(gh pr diff "$PR" --name-only 2>/dev/null) \
        || { echo "ERROR: cannot fetch PR file names" >&2; exit 2; }
    fi
  fi
  echo "$NAMES_CACHE"
}

added_lines() {
  get_diff | grep "^+" | grep -v "^+++" || true
}

# Added lines restricted to files matching a regex on the path. Optional
# second arg is an exclusion regex — defaults to the gate-defining scripts
# (codebase-check, pr-checks, check-inline-suppressions) so they don't
# self-match when they reference the banned tokens as patterns.
GATE_SCRIPTS_EXCLUDE='(^|/)(scripts/(codebase-check|pr-checks|check-inline-suppressions)\.(sh|mjs))$'

# shellcheck disable=SC2120  # optional second arg used only by tests
added_in_files() {
  local pattern="$1"
  local exclude="${2:-$GATE_SCRIPTS_EXCLUDE}"
  get_diff | awk -v pattern="$pattern" -v exclude="$exclude" '
    /^diff --git / {
      n = split($0, parts, " b/")
      file = parts[n]
      keep = (file ~ pattern) && !(file ~ exclude)
      next
    }
    /^\+\+\+/ { next }
    /^\+/ && keep { print }
  '
}

# shellcheck disable=SC2120  # optional arg used only by tests
added_prod() {
  # Added lines from production files only. File-aware via `diff --git`
  # markers. Skips test/spec/fixture files AND the gate-defining scripts
  # themselves (they reference banned tokens as patterns).
  local exclude="${1:-$GATE_SCRIPTS_EXCLUDE}"
  get_diff | awk -v exclude="$exclude" '
    /^diff --git / {
      n = split($0, parts, " b/")
      file = parts[n]
      is_test = (file ~ /\.test\./) || (file ~ /\.spec\./) ||
                (file ~ /test-factory\./) || (file ~ /test-helpers\./) ||
                (file ~ /\/__tests__\//) || (file ~ /\/fixtures\//)
      is_gate = (file ~ exclude)
      next
    }
    /^\+\+\+/ { next }
    /^\+/ && !is_test && !is_gate { print }
  '
}

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
  printf "| %-4s | %-45s | %-7s | %s |\n" "$id" "$name" "$verdict" "$evidence"
}

echo "## PR Checks — ${PR}"
echo ""
echo "| #    | Check                                         | Verdict | Evidence |"
echo "|------|-----------------------------------------------|---------|----------|"

# A5: PR body accuracy — REVIEW row (cannot be automated). asal-world ships
# this as a checklist row reviewers tick off; we mirror it.
if [ "$PR" = "local" ]; then
  row "A5" "PR body accuracy" "PASS" "no PR (local run)"
else
  row "A5" "PR body accuracy" "REVIEW" "manual check required"
fi

# A11: HANDOFF v1 block on code PRs (E-006). Skipped on docs/devops/deps
# branches, where the protocol is unnecessary.
if [ "$PR" = "local" ]; then
  row "A11" "HANDOFF v1 block (E-006)" "PASS" "no PR (local run)"
else
  pr_body=$(gh pr view "$PR" --json body --jq '.body' 2>/dev/null || echo "")
  branch=$(gh pr view "$PR" --json headRefName --jq '.headRefName' 2>/dev/null || echo "")
  if [[ "$branch" =~ ^(docs|devops|deps|dependabot)/ ]]; then
    row "A11" "HANDOFF v1 block (E-006)" "PASS" "not required for $branch"
  elif echo "$pr_body" | grep -q '<!-- HANDOFF v1'; then
    row "A11" "HANDOFF v1 block (E-006)" "PASS" "HANDOFF v1 present"
  else
    row "A11" "HANDOFF v1 block (E-006)" "FAIL" "HANDOFF v1 missing — code PRs require it"
  fi
fi

# A12: REVIEW-STATE v1 block in any review or comment.
if [ "$PR" = "local" ]; then
  row "A12" "REVIEW-STATE v1 block (E-006)" "PASS" "no PR (local run)"
else
  branch=$(gh pr view "$PR" --json headRefName --jq '.headRefName' 2>/dev/null || echo "")
  if [[ "$branch" =~ ^(docs|devops|deps|dependabot)/ ]]; then
    row "A12" "REVIEW-STATE v1 block (E-006)" "PASS" "not required for $branch"
  else
    review_bodies=$(gh pr view "$PR" --json reviews --jq '.reviews[].body // empty' 2>/dev/null || echo "")
    comment_bodies=$(gh pr view "$PR" --json comments --jq '.comments[].body // empty' 2>/dev/null || echo "")
    if echo "$review_bodies" "$comment_bodies" | grep -q 'REVIEW-STATE v1'; then
      row "A12" "REVIEW-STATE v1 block (E-006)" "PASS" "REVIEW-STATE v1 found"
    else
      row "A12" "REVIEW-STATE v1 block (E-006)" "REVIEW" \
        "REVIEW-STATE v1 not yet posted — required before merge"
    fi
  fi
fi

# A1: TODO/FIXME without issue number — scoped to code files only. Lint
# configs (`.swiftlint.yml`, `eslint.config.js`, `ruff.toml`, etc.)
# legitimately define the regex pattern that catches TODO/FIXME, so they're
# excluded.
A1_PATTERN='\.(ts|tsx|js|mjs|cjs|jsx|swift|py|sh)$'
a1_hits=$(added_in_files "$A1_PATTERN" | grep -iE "TODO|FIXME" | grep -v "#[0-9]" || true)
a1_count=$(count_lines "$a1_hits")
if [ "$a1_count" -gt 0 ] && [ -n "$a1_hits" ]; then
  row "A1" "TODO/FIXME without issue number" "FAIL" "${a1_count} hits"
else
  row "A1" "TODO/FIXME without issue number" "PASS" "0 hits"
fi

# A2: caret/tilde versions — scoped to package.json files only. Regex
# strings in JSON configs (e.g., commitlint scopes) legitimately contain
# `"^` literals.
A2_PATTERN='(^|/)package\.json$'
a2_hits=$(added_in_files "$A2_PATTERN" | grep -E '"\^|"~' || true)
a2_count=$(count_lines "$a2_hits")
if [ "$a2_count" -gt 0 ] && [ -n "$a2_hits" ]; then
  row "A2" "caret/tilde versions in package.json" "FAIL" "${a2_count} hits"
else
  row "A2" "caret/tilde versions in package.json" "PASS" "0 hits"
fi

# A3 / A4 / A6: informational rows. The actual enforcement lives in other
# CI gates (commitlint workflow, branch-name-check, flaky-check Make
# target). Surfacing them here keeps the per-PR audit table complete so
# reviewers see every A-row at a glance.
row "A3" "commit message format" "PASS" "verified by commitlint CI check"
row "A4" "branch name format" "PASS" "verified by branch-name CI check"
row "A6" "flaky test detection" "PASS" "verified by flaky-check CI job"

# A7: license compliance — new dependency lines flagged for review.
a7_hits=$(added_lines | grep -E '"dependencies"|"devDependencies"' || true)
a7_count=$(count_lines "$a7_hits")
if [ "$a7_count" -gt 0 ]; then
  row "A7" "license compliance (new deps)" "REVIEW" \
    "${a7_count} dep block changes — verify licenses + run 'pnpm run license-check'"
else
  row "A7" "license compliance (new deps)" "PASS" "no dependency changes"
fi

# A8: bundle size — plugin/package.json or build config changed.
a8_hits=$(get_names | grep -E "^(plugin/package\.json|plugin/esbuild\.config|esbuild\.config)" || true)
a8_count=$(count_lines "$a8_hits")
if [ "$a8_count" -gt 0 ] && [ -n "$a8_hits" ]; then
  row "A8" "bundle size budget (250 KB gz)" "REVIEW" \
    "plugin build config changed — run 'pnpm run size'"
else
  row "A8" "bundle size budget (250 KB gz)" "PASS" "no bundle-affecting changes"
fi

# A9: quality-gate weakening — production code adding ignore/exclude/threshold
# keywords that suggest a relax. REVIEW (not FAIL) — reviewer judges intent.
a9_hits=$(added_prod \
  | grep -iE "ignore|exclude|threshold|grandfather|excluded_rules|excluded_paths|disable" \
  | grep -v node_modules || true)
a9_count=$(count_lines "$a9_hits")
if [ "$a9_count" -gt 0 ] && [ -n "$a9_hits" ]; then
  row "A9" "quality-gate weakening" "REVIEW" \
    "${a9_count} hits — verify no gates lowered"
else
  row "A9" "quality-gate weakening" "PASS" "0 hits"
fi

# A10: docs-code drift — when docs/decisions, docs/runbooks, or docs/conventions
# files are modified, surface added claim-shaped lines for cross-reference.
A10_DOC_PATTERN='^docs/(decisions|runbooks|conventions|architecture)/'
a10_doc_files=$(get_names | grep -E "$A10_DOC_PATTERN" || true)
a10_doc_count=$(count_lines "$a10_doc_files")
if [ "$a10_doc_count" -gt 0 ] && [ -n "$a10_doc_files" ]; then
  a10_hits=$(get_diff | awk -v pattern="$A10_DOC_PATTERN" '
    /^diff --git / {
      n = split($0, parts, " b/")
      file = parts[n]
      in_doc = (file ~ pattern)
      next
    }
    /^\+\+\+/ { next }
    /^\+/ && in_doc { print file ": " substr($0, 2) }
  ' | grep -iE "verif(y|ies|ied)|test(s|ed) (for|that)|ensure[sd]?|guarantee|always|never" | head -20 || true)
  a10_count=$(count_lines "$a10_hits")
  if [ "$a10_count" -gt 0 ] && [ -n "$a10_hits" ]; then
    row "A10" "docs-code drift (claims in doc diff)" "REVIEW" \
      "${a10_count} claim(s) across ${a10_doc_count} doc file(s) — cross-reference against code diff"
  else
    row "A10" "docs-code drift (claims in doc diff)" "PASS" \
      "0 claims in ${a10_doc_count} doc file(s)"
  fi
else
  row "A10" "docs-code drift (claims in doc diff)" "PASS" "no doc files in diff"
fi

echo ""
echo "**Total: ${TOTAL_COUNT} checks | FAIL: ${FAIL_COUNT}**"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
