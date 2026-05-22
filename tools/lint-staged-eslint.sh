#!/usr/bin/env bash
#
# Per-workspace ESLint runner for lint-staged routing.
#
# lint-staged in package.json passes the workspace name as $1 and the staged
# files as $2..$N. We `cd` into the workspace so eslint resolves the
# workspace's own flat config and uses the workspace's own ESLint binary from
# its node_modules.
#
# Usage in package.json lint-staged config:
#   "server/**/*.{ts,js}": ["tools/lint-staged-eslint.sh server"]

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "lint-staged-eslint.sh: expected workspace name + at least one file path"
  echo "  usage: lint-staged-eslint.sh <workspace> <file>..."
  exit 2
fi

WORKSPACE=$1
shift

if [ ! -d "$WORKSPACE" ]; then
  echo "lint-staged-eslint.sh: workspace directory '$WORKSPACE' does not exist"
  exit 2
fi

cd "$WORKSPACE"
exec pnpm exec eslint --fix --no-warn-ignored --max-warnings 0 "$@"
