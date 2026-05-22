#!/usr/bin/env bats
# bats-core tests for scripts/check-inline-suppressions.mjs.
#
# The script is critical: it gates the Allow-Suppression: trailer bypass.
# Regressions here would either (a) let suppressions land without review
# or (b) block every commit. Both are existential failures.

setup() {
  TEST_DIR="$(mktemp -d)"
  REPO_ROOT="$BATS_TEST_DIRNAME/../.."
  SCRIPT="$REPO_ROOT/scripts/check-inline-suppressions.mjs"
  cd "$TEST_DIR"
  git init -q
  git config user.email "test@test.invalid"
  git config user.name "test"
  git config commit.gpgsign false
  # Seed an initial commit so HEAD~1 resolves.
  echo "// seed" > seed.ts
  git add seed.ts
  git commit -q -m "seed"
}

teardown() {
  cd /
  rm -rf "$TEST_DIR"
}

@test "no suppressions added: exits 0" {
  echo "export const x = 1" > foo.ts
  git add foo.ts
  git commit -q -m "feat: add foo"
  run node "$SCRIPT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"no new inline suppressions"* ]]
}

@test "new eslint-disable: exits 1" {
  cat > foo.ts <<'EOF'
// eslint-disable-next-line no-console
console.log('x')
EOF
  git add foo.ts
  git commit -q -m "feat: add foo"
  run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"eslint-disable"* ]]
}

@test "Allow-Suppression trailer bypasses gate" {
  cat > foo.ts <<'EOF'
// eslint-disable-next-line no-console
console.log('x')
EOF
  git add foo.ts
  printf 'feat: add foo\n\nAllow-Suppression: scaffold needed it\n' > /tmp/msg.txt
  git commit -q -F /tmp/msg.txt
  rm /tmp/msg.txt
  run node "$SCRIPT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"gate bypassed"* ]]
}

@test "Allow-Suppression mid-line (not a trailer) does NOT bypass" {
  cat > foo.ts <<'EOF'
// eslint-disable-next-line no-console
console.log('x')
EOF
  git add foo.ts
  printf 'feat: add foo with Allow-Suppression: inline\n' > /tmp/msg.txt
  git commit -q -F /tmp/msg.txt
  rm /tmp/msg.txt
  # Subject line "feat: add foo with Allow-Suppression: inline" — note this
  # technically matches /^Allow-Suppression:/m because of the "with" prefix.
  # Confirm the regex requires the literal start-of-line.
  run node "$SCRIPT"
  # The trailer regex is /^Allow-Suppression:\s*\S+/m which requires the
  # literal to start at the beginning of a line. The subject above has
  # "feat: add foo with Allow-Suppression: ..." — Allow-Suppression is mid-line
  # so it should NOT bypass.
  [ "$status" -eq 1 ]
}

@test "new @ts-expect-error: exits 1" {
  cat > foo.ts <<'EOF'
// @ts-expect-error legit reason
const x: number = 'string'
EOF
  git add foo.ts
  git commit -q -m "feat: add foo"
  run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ts-expect-error"* ]]
}

@test "new # noqa in .py: exits 1" {
  cat > foo.py <<'EOF'
import os  # noqa: F401
EOF
  git add foo.py
  git commit -q -m "feat: add foo"
  run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"py-noqa"* ]]
}

@test "new // swiftlint:disable: exits 1" {
  cat > foo.swift <<'EOF'
// swiftlint:disable force_unwrap
let x = optional!
EOF
  git add foo.swift
  git commit -q -m "feat: add foo"
  run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"swiftlint-disable"* ]]
}

@test "non-source files are NOT scanned (docs, configs)" {
  cat > docs.md <<'EOF'
This doc mentions eslint-disable as part of its prose.
EOF
  git add docs.md
  git commit -q -m "docs: add doc"
  run node "$SCRIPT"
  [ "$status" -eq 0 ]
}

@test "self-reference: this script's own diff is excluded" {
  # The script excludes itself from scanning via PATH_EXCLUDES.
  # Add a fake line to the real script path under TEST_DIR.
  mkdir -p scripts
  cp "$SCRIPT" scripts/check-inline-suppressions.mjs
  echo "// eslint-disable-next-line no-console" >> scripts/check-inline-suppressions.mjs
  git add scripts/check-inline-suppressions.mjs
  git commit -q -m "feat: tweak gate"
  run node "$SCRIPT"
  [ "$status" -eq 0 ]
}
