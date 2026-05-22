#!/usr/bin/env bats
# bats-core tests for scripts/check-skill-content.sh.

setup() {
  TEST_DIR="$(mktemp -d)"
  REPO_ROOT="$BATS_TEST_DIRNAME/../.."
  SOURCE_SCRIPT="$REPO_ROOT/scripts/check-skill-content.sh"
  # The script computes REPO_ROOT from its own location ($BASH_SOURCE/..).
  # Place a copy under TEST_DIR/scripts/ so REPO_ROOT resolves to TEST_DIR.
  mkdir -p "$TEST_DIR/scripts"
  mkdir -p "$TEST_DIR/.claude/skills/alpha"
  mkdir -p "$TEST_DIR/.claude/skills/beta"
  cp "$SOURCE_SCRIPT" "$TEST_DIR/scripts/check-skill-content.sh"
  chmod +x "$TEST_DIR/scripts/check-skill-content.sh"
  SCRIPT="$TEST_DIR/scripts/check-skill-content.sh"
  printf 'alpha\n' > "$TEST_DIR/.claude/skills/alpha/SKILL.md"
  printf 'beta\n' > "$TEST_DIR/.claude/skills/beta/SKILL.md"
}

teardown() {
  rm -rf "$TEST_DIR"
}

@test "first run writes manifest, exits 0" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"initial manifest written"* ]]
  [ -f "$TEST_DIR/.claude/skills/.manifest.sha256" ]
}

@test "second run with unchanged skills is PASS" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OK"* ]]
  [[ "$output" == *"2 skills"* ]]
}

@test "modifying a skill triggers DRIFT" {
  run bash "$SCRIPT"
  printf 'alpha modified\n' > "$TEST_DIR/.claude/skills/alpha/SKILL.md"
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"DRIFT"* ]]
}

@test "adding a new skill triggers DRIFT" {
  run bash "$SCRIPT"
  mkdir -p "$TEST_DIR/.claude/skills/gamma"
  printf 'gamma\n' > "$TEST_DIR/.claude/skills/gamma/SKILL.md"
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"DRIFT"* ]]
}

@test "removing a skill triggers DRIFT" {
  run bash "$SCRIPT"
  rm -rf "$TEST_DIR/.claude/skills/beta"
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"DRIFT"* ]]
}

@test "update mode regenerates manifest" {
  run bash "$SCRIPT"
  printf 'alpha changed\n' > "$TEST_DIR/.claude/skills/alpha/SKILL.md"
  run bash "$SCRIPT" update
  [ "$status" -eq 0 ]
  [[ "$output" == *"manifest regenerated"* ]]
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OK"* ]]
}

@test "no .claude/skills/ dir exits cleanly" {
  rm -rf "$TEST_DIR/.claude"
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"does not exist"* ]]
}
