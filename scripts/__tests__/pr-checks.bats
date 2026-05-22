#!/usr/bin/env bats
# bats-core tests for scripts/pr-checks.sh.
#
# Uses PR=local mode against a fresh git repo with a synthetic
# origin/main + feature branch, so `gh` is not required.

setup() {
  TEST_DIR="$(mktemp -d)"
  REPO_ROOT="$BATS_TEST_DIRNAME/../.."
  SCRIPT="$REPO_ROOT/scripts/pr-checks.sh"
  cd "$TEST_DIR"
  git init -q -b main
  git config user.email "test@test.invalid"
  git config user.name "test"
  git config commit.gpgsign false

  # main: seed
  echo "seed" > seed.txt
  git add seed.txt
  git commit -q -m "seed"

  # Fake remote so `origin/main` resolves locally.
  git clone -q --bare . "$TEST_DIR/origin.git" 2>/dev/null
  git remote add origin "$TEST_DIR/origin.git"
  git fetch -q origin
  git branch --set-upstream-to=origin/main main 2>/dev/null || true

  # feature branch off main.
  git checkout -q -b feature/test
}

teardown() {
  cd /
  rm -rf "$TEST_DIR"
}

commit_file() {
  local file="$1" content="$2"
  mkdir -p "$(dirname "$file")"
  printf '%s\n' "$content" > "$file"
  git add "$file"
  git commit -q -m "feat: add $file"
}

@test "A1 PASS: no TODO without issue" {
  commit_file "foo.ts" "export const x = 1"
  run bash "$SCRIPT" local
  [ "$status" -eq 0 ]
  [[ "$output" == *"| A1   |"*"PASS"* ]]
}

@test "A1 FAIL: TODO without issue in .ts" {
  commit_file "foo.ts" "// TODO clean this"
  run bash "$SCRIPT" local
  [ "$status" -eq 1 ]
  [[ "$output" == *"| A1   |"*"FAIL"* ]]
}

@test "A1 PASS: TODO(#42) is permitted" {
  commit_file "foo.ts" "// TODO(#42) clean this"
  run bash "$SCRIPT" local
  [ "$status" -eq 0 ]
  [[ "$output" == *"| A1   |"*"PASS"* ]]
}

@test "A1 PASS: TODO mentions in .md docs do not trigger" {
  commit_file "docs/note.md" "We use a TODO comment style."
  run bash "$SCRIPT" local
  [ "$status" -eq 0 ]
  [[ "$output" == *"| A1   |"*"PASS"* ]]
}

@test "A2 FAIL: caret version in package.json" {
  commit_file "package.json" '{"dependencies":{"x":"^1.0.0"}}'
  run bash "$SCRIPT" local
  [ "$status" -eq 1 ]
  [[ "$output" == *"| A2   |"*"FAIL"* ]]
}

@test "A2 PASS: exact version in package.json" {
  commit_file "package.json" '{"dependencies":{"x":"1.0.0"}}'
  run bash "$SCRIPT" local
  [ "$status" -eq 0 ]
  [[ "$output" == *"| A2   |"*"PASS"* ]]
}

@test "A2 PASS: caret in JSON elsewhere does not trigger" {
  commit_file "commitlint.config.js" 'module.exports = {regex: "^[a-z]"}'
  run bash "$SCRIPT" local
  [ "$status" -eq 0 ]
  [[ "$output" == *"| A2   |"*"PASS"* ]]
}

@test "A5/A11/A12 are PASS in local mode (no PR)" {
  commit_file "foo.ts" "export const x = 1"
  run bash "$SCRIPT" local
  [[ "$output" == *"| A5   |"*"PASS"*"no PR"* ]]
  [[ "$output" == *"| A11  |"*"PASS"*"no PR"* ]]
  [[ "$output" == *"| A12  |"*"PASS"*"no PR"* ]]
}

@test "Gate-script self-recursion: changes to pr-checks.sh do not self-trigger A1" {
  commit_file "scripts/pr-checks.sh" "# TODO mentioned as ban pattern"
  run bash "$SCRIPT" local
  [[ "$output" == *"| A1   |"*"PASS"* ]]
}

@test "Total row count is 9" {
  commit_file "foo.ts" "export const x = 1"
  run bash "$SCRIPT" local
  [[ "$output" == *"Total: 9 checks"* ]]
}
