#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Inoyatov Khamidulla and contributors.
#
# Skill content-preservation gate. Ports asal-world's
# `scripts/skill-content-preservation.test.sh` concept.
#
# Why this exists: `.claude/skills/*/SKILL.md` files are authoritative
# behavioural specs for AI agents that operate on this repo. They can be
# silently mutated by Prettier rewrites, helpful AI edits during a
# session, or a misplaced sed. Drift here is invisible to type-check or
# lint — only a content-hash gate catches it.
#
# Strategy:
#   1. Compute a SHA-256 of every .claude/skills/*/SKILL.md (sorted).
#   2. Combine into a single manifest hash.
#   3. Compare against the checked-in manifest at
#      `.claude/skills/.manifest.sha256`.
#   4. If the manifest is missing, write it (first run / new repo).
#   5. If the manifest is present and differs, fail with a diff hint.
#
# Update flow (when a skill is intentionally edited):
#   $ make skill-content-update     # regenerates the manifest
#   $ git add .claude/skills/.manifest.sha256
#   $ git commit -m "chore(skills): bump manifest after intentional edit"
#
# Exits 0 if manifest matches (or was just written), 1 if drift detected.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/.claude/skills"
MANIFEST_PATH="$SKILLS_DIR/.manifest.sha256"
MODE="${1:-check}"

if [ ! -d "$SKILLS_DIR" ]; then
  echo "skill-content: .claude/skills/ does not exist — nothing to check."
  exit 0
fi

# Compute the manifest: per-file sha then a final sha of the sorted list.
compute_manifest() {
  find "$SKILLS_DIR" -type f -name "SKILL.md" \
    | LC_ALL=C sort \
    | while read -r file; do
        rel="${file#"$REPO_ROOT"/}"
        # shasum is BSD/macOS; sha256sum is GNU. Prefer shasum for parity.
        if command -v shasum >/dev/null 2>&1; then
          sha=$(shasum -a 256 "$file" | awk '{print $1}')
        else
          sha=$(sha256sum "$file" | awk '{print $1}')
        fi
        printf '%s  %s\n' "$sha" "$rel"
      done
}

case "$MODE" in
  check)
    if [ ! -f "$MANIFEST_PATH" ]; then
      echo "skill-content: no manifest at $MANIFEST_PATH — writing initial."
      compute_manifest > "$MANIFEST_PATH"
      echo "skill-content: initial manifest written. Commit it."
      exit 0
    fi
    actual=$(compute_manifest)
    expected=$(cat "$MANIFEST_PATH")
    if [ "$actual" = "$expected" ]; then
      count=$(echo "$actual" | grep -c . || echo 0)
      echo "skill-content: OK (${count} skills, manifest matches)."
      exit 0
    fi
    echo "skill-content: DRIFT detected in .claude/skills/."
    echo ""
    echo "Expected manifest (committed):"
    echo "$expected" | head -5
    echo "..."
    echo ""
    echo "Actual manifest (now):"
    echo "$actual" | head -5
    echo "..."
    echo ""
    echo "Diff:"
    diff <(echo "$expected") <(echo "$actual") || true
    echo ""
    echo "If the change is intentional, run:"
    echo "  make skill-content-update && git add $MANIFEST_PATH"
    echo ""
    echo "If unintentional, revert the skill edit."
    exit 1
    ;;
  update)
    compute_manifest > "$MANIFEST_PATH"
    count=$(grep -c . "$MANIFEST_PATH" || echo 0)
    echo "skill-content: manifest regenerated (${count} skills)."
    echo "Commit $MANIFEST_PATH to lock in the new state."
    ;;
  *)
    echo "Usage: $0 [check|update]" >&2
    exit 2
    ;;
esac
