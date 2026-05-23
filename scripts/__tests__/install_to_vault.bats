#!/usr/bin/env bats
# bats-core tests for scripts/install_to_vault.sh.
#
# Each test stages a throwaway "repo root" with the three publishable
# artifacts (main.js, manifest.json, styles.css) and a throwaway vault
# directory, then invokes the script and asserts on the resulting state.
# Tests always run with SKIP_BUILD=1 so they never invoke `pnpm run build`.

setup() {
  TEST_DIR="$(mktemp -d)"
  REPO_ROOT="$BATS_TEST_DIRNAME/../.."
  SOURCE_SCRIPT="$REPO_ROOT/scripts/install_to_vault.sh"

  # Copy the script into a fake repo root so its REPO_ROOT resolution
  # (cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd) points at TEST_DIR
  # instead of the real earshot repo.
  mkdir -p "$TEST_DIR/scripts"
  cp "$SOURCE_SCRIPT" "$TEST_DIR/scripts/install_to_vault.sh"
  chmod +x "$TEST_DIR/scripts/install_to_vault.sh"
  SCRIPT="$TEST_DIR/scripts/install_to_vault.sh"

  # Stage the three publishable artifacts at the fake repo root.
  printf 'module.exports = {}\n' > "$TEST_DIR/main.js"
  printf '{"id":"earshot","name":"Earshot","version":"0.1.0"}\n' > "$TEST_DIR/manifest.json"
  printf '/* earshot */\n' > "$TEST_DIR/styles.css"

  # Stage a fake Obsidian vault.
  VAULT="$TEST_DIR/test-vault"
  mkdir -p "$VAULT/.obsidian"
}

teardown() {
  rm -rf "$TEST_DIR"
}

@test "no args → exit 2 with usage message" {
  run env SKIP_BUILD=1 bash "$SCRIPT"
  [ "$status" -eq 2 ]
  [[ "$output" == *"Usage: scripts/install_to_vault.sh <vault-path>"* ]]
}

@test "nonexistent vault path → exit 1" {
  run env SKIP_BUILD=1 bash "$SCRIPT" "$TEST_DIR/no-such-vault"
  [ "$status" -eq 1 ]
  [[ "$output" == *"vault path does not exist"* ]]
}

@test "path without .obsidian/ → exit 1 (not a vault)" {
  mkdir -p "$TEST_DIR/not-a-vault"
  run env SKIP_BUILD=1 bash "$SCRIPT" "$TEST_DIR/not-a-vault"
  [ "$status" -eq 1 ]
  [[ "$output" == *"not an Obsidian vault"* ]]
}

@test "happy path: copies main.js, manifest.json, styles.css to <vault>/.obsidian/plugins/earshot/" {
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"Installed Earshot plugin"* ]]
  [ -f "$VAULT/.obsidian/plugins/earshot/main.js" ]
  [ -f "$VAULT/.obsidian/plugins/earshot/manifest.json" ]
  [ -f "$VAULT/.obsidian/plugins/earshot/styles.css" ]
}

@test "happy path: copied files match source byte-for-byte" {
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 0 ]
  diff "$TEST_DIR/main.js" "$VAULT/.obsidian/plugins/earshot/main.js"
  diff "$TEST_DIR/manifest.json" "$VAULT/.obsidian/plugins/earshot/manifest.json"
  diff "$TEST_DIR/styles.css" "$VAULT/.obsidian/plugins/earshot/styles.css"
}

@test "creates .obsidian/plugins/earshot/ when missing" {
  [ ! -d "$VAULT/.obsidian/plugins" ]
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 0 ]
  [ -d "$VAULT/.obsidian/plugins/earshot" ]
}

@test "idempotent: second run overwrites without error" {
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 0 ]
  # Mutate the installed copy, then run again — should be restored.
  echo "stale" > "$VAULT/.obsidian/plugins/earshot/main.js"
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 0 ]
  diff "$TEST_DIR/main.js" "$VAULT/.obsidian/plugins/earshot/main.js"
}

@test "missing main.js artifact → exit 1 with clear error" {
  rm "$TEST_DIR/main.js"
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"missing build artifact at repo root: main.js"* ]]
}

@test "missing manifest.json artifact → exit 1" {
  rm "$TEST_DIR/manifest.json"
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"missing build artifact at repo root: manifest.json"* ]]
}

@test "missing styles.css artifact → exit 1" {
  rm "$TEST_DIR/styles.css"
  run env SKIP_BUILD=1 bash "$SCRIPT" "$VAULT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"missing build artifact at repo root: styles.css"* ]]
}

@test "accepts relative vault path and resolves to absolute" {
  cd "$TEST_DIR"
  run env SKIP_BUILD=1 bash "$SCRIPT" "./test-vault"
  [ "$status" -eq 0 ]
  [ -f "$VAULT/.obsidian/plugins/earshot/main.js" ]
}
