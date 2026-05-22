#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Codesign a macOS .app bundle with the developer's free Apple Development
# Personal Team certificate. Required for stable TCC permissions across rebuilds.
#
# Usage: ./scripts/sign-with-personal-team.sh path/to/My.app
set -euo pipefail

APP="${1:-}"
test -n "$APP" || { echo "Usage: $0 path/to/.app"; exit 1; }
test -d "$APP" || { echo "ERROR: $APP is not a directory"; exit 1; }

# Find the first "Apple Development:" cert in the login keychain.
IDENTITY=$(security find-identity -v -p codesigning | grep "Apple Development:" | head -1 | sed -E 's/.* "(Apple Development:[^"]+)".*/\1/' || true)

if [ -z "$IDENTITY" ]; then
  echo "ERROR: No 'Apple Development:' certificate found in your keychain."
  echo "       Open Xcode → Settings → Accounts → Manage Certificates"
  echo "       and click '+' → 'Apple Development' to create one (free)."
  echo "       The cert is stable across rebuilds; TCC permissions persist."
  exit 1
fi

echo "Signing with: $IDENTITY"
codesign --force \
  --options runtime \
  --sign "$IDENTITY" \
  --entitlements EarshotCapture.entitlements \
  --identifier com.earshot-tools.capture \
  "$APP"

codesign --display --verbose=2 "$APP" 2>&1 | head -10
echo "Signed."
