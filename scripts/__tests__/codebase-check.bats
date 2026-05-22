#!/usr/bin/env bats
# bats-core tests for scripts/codebase-check.sh.
#
# Each test creates a throwaway directory tree mimicking plugin/src or
# shared/src layout, runs codebase-check.sh against it, and asserts on the
# output. Tests intentionally exercise the row-by-row behaviour — both the
# FAIL path (a violation lands a 'FAIL' verdict) and the exemption path
# (Obsidian entry point gets a free pass on `export default`).

setup() {
  TEST_DIR="$(mktemp -d)"
  REPO_ROOT="$BATS_TEST_DIRNAME/../.."
  SCRIPT="$REPO_ROOT/scripts/codebase-check.sh"
}

teardown() {
  rm -rf "$TEST_DIR"
}

# Build a fake plugin/src layout under TEST_DIR.
make_fake_plugin() {
  mkdir -p "$TEST_DIR/plugin/src"
  cd "$TEST_DIR"
}

@test "S1: process.env outside config.ts is a FAIL" {
  make_fake_plugin
  cat > plugin/src/main.ts <<'EOF'
export const x = process.env.NODE_ENV
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| S1   |"*"FAIL"* ]]
}

@test "S1: process.env inside config.ts is PASS" {
  make_fake_plugin
  cat > plugin/src/config.ts <<'EOF'
export const env = process.env.NODE_ENV
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"| S1   |"*"PASS"* ]]
}

@test "S3: console.* outside logger.ts is a FAIL" {
  make_fake_plugin
  cat > plugin/src/feature.ts <<'EOF'
export function f(): void { console.warn('x') }
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| S3   |"*"FAIL"* ]]
}

@test "S3: console.* inside logger.ts is PASS" {
  make_fake_plugin
  cat > plugin/src/logger.ts <<'EOF'
export function log(): void { console.warn('x') }
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"| S3   |"*"PASS"* ]]
}

@test "S4: export default at plugin/src/main.ts is exempt (obsidian entry)" {
  make_fake_plugin
  cat > plugin/src/main.ts <<'EOF'
export default class P {}
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"| S4   |"*"PASS"* ]]
}

@test "S4: export default anywhere else is a FAIL" {
  make_fake_plugin
  cat > plugin/src/util.ts <<'EOF'
export default function util(): void {}
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| S4   |"*"FAIL"* ]]
}

@test "S5: TODO without issue number is a FAIL" {
  make_fake_plugin
  cat > plugin/src/foo.ts <<'EOF'
// TODO clean this up later
export const x = 1
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| S5   |"*"FAIL"* ]]
}

@test "S5: TODO with #issue is PASS" {
  make_fake_plugin
  cat > plugin/src/foo.ts <<'EOF'
// TODO(#42) clean this up later
export const x = 1
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"| S5   |"*"PASS"* ]]
}

@test "S8: direct undici import is a FAIL" {
  make_fake_plugin
  cat > plugin/src/net.ts <<'EOF'
import { fetch } from 'undici'
export const f = fetch
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| S8   |"*"FAIL"* ]]
}

@test "S8b: bare fetch() is a FAIL" {
  make_fake_plugin
  cat > plugin/src/net.ts <<'EOF'
export async function get(): Promise<Response> { return fetch('https://x') }
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| S8b  |"*"FAIL"* ]]
}

@test "C1: as unknown as is a FAIL" {
  make_fake_plugin
  cat > plugin/src/x.ts <<'EOF'
export const v = (1 as unknown as string)
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| C1   |"*"FAIL"* ]]
}

@test "C2: any type is a FAIL" {
  make_fake_plugin
  cat > plugin/src/x.ts <<'EOF'
export function f(x: any): any { return x }
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| C2   |"*"FAIL"* ]]
}

@test "C4: eval() is a FAIL" {
  make_fake_plugin
  cat > plugin/src/x.ts <<'EOF'
export function f(s: string): unknown { return eval(s) }
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 1 ]
  [[ "$output" == *"| C4   |"*"FAIL"* ]]
}

@test "S9: 'as X' surfaces as REVIEW (not FAIL)" {
  make_fake_plugin
  cat > plugin/src/x.ts <<'EOF'
export const x = ('foo' as string)
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"| S9   |"*"REVIEW"* ]]
}

@test "C7: .parse() surfaces as REVIEW" {
  make_fake_plugin
  cat > plugin/src/x.ts <<'EOF'
import { z } from 'zod'
const S = z.object({})
export const v = S.parse({})
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"| C7   |"*"REVIEW"* ]]
}

@test "Test files are excluded from production scope" {
  make_fake_plugin
  mkdir -p plugin/src/__tests__
  cat > plugin/src/__tests__/anything.test.ts <<'EOF'
export const v = process.env.NODE_ENV
EOF
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"| S1   |"*"PASS"* ]]
}

@test "Empty tree returns 0 with all PASS" {
  make_fake_plugin
  run bash "$SCRIPT" plugin/src
  [ "$status" -eq 0 ]
  [[ "$output" == *"FAIL: 0"* ]]
}
