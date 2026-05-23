#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Inoyatov Khamidulla and contributors.
#
# Install the Earshot plugin into a local Obsidian vault.
#
# Usage:
#   scripts/install_to_vault.sh <vault-path>
#   SKIP_BUILD=1 scripts/install_to_vault.sh <vault-path>
#
# Behaviour:
#   1. Resolves <vault-path> to an absolute path; fails if it does not exist
#      or does not contain a `.obsidian/` directory (i.e., not a vault).
#   2. Runs `pnpm run build` from the repo root unless SKIP_BUILD=1.
#   3. Copies the three publishable artifacts into
#      `<vault>/.obsidian/plugins/earshot/`:
#        - main.js     (the built plugin bundle)
#        - manifest.json
#        - styles.css
#      The target directory is created if it doesn't exist; existing files
#      are overwritten.
#   4. Prints the install path on success.
#
# This script ships exactly what Obsidian loads — no source maps, no
# workspace `dist/` artifacts. See `make check-sourcemaps`.
#
# Exit codes:
#   0  install succeeded
#   1  vault-path missing, not a vault, or build failed
#   2  argument missing

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_ID="earshot"
ARTIFACTS=("main.js" "manifest.json" "styles.css")

if [ "${1:-}" = "" ]; then
  echo "Usage: scripts/install_to_vault.sh <vault-path>" >&2
  exit 2
fi

VAULT_PATH="$1"

# Resolve to absolute path. Bash on macOS doesn't have GNU realpath; do it
# with cd+pwd which is POSIX-portable.
if [ ! -d "$VAULT_PATH" ]; then
  echo "ERROR: vault path does not exist: $VAULT_PATH" >&2
  exit 1
fi
VAULT_ABS="$(cd "$VAULT_PATH" && pwd)"

if [ ! -d "$VAULT_ABS/.obsidian" ]; then
  echo "ERROR: '$VAULT_ABS' does not contain a .obsidian/ directory — not an Obsidian vault" >&2
  exit 1
fi

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "Building plugin..."
  (cd "$REPO_ROOT" && pnpm run build)
fi

# Verify the three artifacts exist at the repo root before copying.
for artifact in "${ARTIFACTS[@]}"; do
  if [ ! -f "$REPO_ROOT/$artifact" ]; then
    echo "ERROR: missing build artifact at repo root: $artifact" >&2
    echo "       Run 'pnpm run build' first, or omit SKIP_BUILD=1." >&2
    exit 1
  fi
done

TARGET_DIR="$VAULT_ABS/.obsidian/plugins/$PLUGIN_ID"
mkdir -p "$TARGET_DIR"

for artifact in "${ARTIFACTS[@]}"; do
  cp "$REPO_ROOT/$artifact" "$TARGET_DIR/$artifact"
done

echo "Installed Earshot plugin → $TARGET_DIR"
echo "Next: open Obsidian, go to Settings → Community plugins, enable 'Earshot'."
