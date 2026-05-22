#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Build the EarshotCapture helper in release mode.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building EarshotCapture (release) ..."
swift build -c release -Xswiftc -warnings-as-errors

echo "Binary at: $(swift build -c release --show-bin-path)/EarshotCLI"
