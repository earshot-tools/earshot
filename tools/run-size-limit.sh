#!/usr/bin/env bash
#
# Size-limit wrapper that distinguishes "real budget breach" (FAIL) from the
# narrowly-allowed "async route chunks rule has no matching files yet" (warn).
#
# Strict mode: the only tolerated dormant rule is `async route chunks (gzip)`,
# because Vite emits per-route chunks only after the first `lazy(() => import(...))`.
# Initial JS and CSS rules are HARD gates.
#
# Usage (from a workspace dir):
#   ../tools/run-size-limit.sh

set -uo pipefail

OUTPUT=$(pnpm exec size-limit 2>&1)
EXIT_CODE=$?

echo "$OUTPUT"

if [ $EXIT_CODE -eq 0 ]; then
  exit 0
fi

if echo "$OUTPUT" | grep -qE "Size limit has exceeded|exceeded by"; then
  echo ""
  echo "BUDGET BREACH — at least one bundle exceeds its size-limit budget"
  exit 1
fi

MISSING_RULES=$(echo "$OUTPUT" | awk '
  /Size Limit can.t find files|cant find files/ {
    sub(/^[[:space:]]+/, "", prev)
    print prev
  }
  { prev = $0 }
')

if [ -z "$MISSING_RULES" ]; then
  echo ""
  echo "size-limit failed for an unknown reason — see output above"
  exit 1
fi

DISALLOWED=$(echo "$MISSING_RULES" | grep -v "async route chunks" || true)

if [ -n "$DISALLOWED" ]; then
  echo ""
  echo "size-limit: the following rules have NO matching files:"
  printf '   - %s\n' "${DISALLOWED//$'\n'/$'\n'   - }"
  echo ""
  echo "Only the 'async route chunks (gzip)' rule is tolerated for missing files."
  exit 1
fi

echo ""
echo "size-limit: 'async route chunks' rule has no matching files yet. Treating as PASS."
exit 0
