#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Wrap the release-built EarshotCLI binary into a macOS .app bundle and
# codesign it with the developer's Personal Team certificate.
#
# Output: native/EarshotCapture/build/EarshotCapture.app
set -euo pipefail

cd "$(dirname "$0")/.."

# 1. Build release.
bash scripts/build_release.sh

# 2. Locate the built binary.
BIN_DIR=$(swift build -c release --show-bin-path)
BIN="$BIN_DIR/EarshotCLI"
test -f "$BIN" || { echo "ERROR: $BIN not found"; exit 1; }

# 3. Assemble the .app bundle.
APP="build/EarshotCapture.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cp "$BIN" "$APP/Contents/MacOS/EarshotCLI"
cp Info.plist "$APP/Contents/Info.plist"

# 4. Sign.
bash scripts/sign-with-personal-team.sh "$APP"

echo "Bundle ready: $APP"
codesign --verify --deep --strict --verbose=2 "$APP"
# Confirm Gatekeeper would actually launch it (catches signature problems that --verify misses)
if ! spctl -a -vvv -t exec "$APP" 2>&1 | tee /dev/stderr | grep -qE "accepted|rejected"; then
  echo "WARNING: spctl assessment inconclusive; helper may still launch but bundle may not be Gatekeeper-stable"
fi
