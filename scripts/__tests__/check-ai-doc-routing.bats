#!/usr/bin/env bats
# bats-core tests for scripts/check-ai-doc-routing.mjs.

setup() {
  TEST_DIR="$(mktemp -d)"
  REPO_ROOT="$BATS_TEST_DIRNAME/../.."
  SCRIPT="$REPO_ROOT/scripts/check-ai-doc-routing.mjs"
  cd "$TEST_DIR"
  mkdir -p docs
}

teardown() {
  cd /
  rm -rf "$TEST_DIR"
}

@test "missing AGENTS.md is a FAIL" {
  printf '# index\n' > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"AGENTS.md is missing"* ]]
}

@test "missing docs/ai-index.md is a FAIL" {
  printf '# agents\n' > AGENTS.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"docs/ai-index.md is missing"* ]]
}

@test "both present + all routes exist: PASS" {
  printf '# agents\n' > AGENTS.md
  printf '# index\n- `foo.md`\n' > docs/ai-index.md
  printf '# foo\n' > foo.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"passed"* ]]
}

@test "broken route is a FAIL" {
  printf '# agents\n' > AGENTS.md
  printf '# index\n- `nonexistent.md`\n' > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"nonexistent.md"* ]]
}

@test "conditional marker '(when present)' allows missing route" {
  printf '# agents\n' > AGENTS.md
  printf '# index\n- `optional.ts` (when present)\n' > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 0 ]
}

@test "conditional marker '(if exists)' allows missing route" {
  printf '# agents\n' > AGENTS.md
  printf '# index\n- `optional.ts` (if exists)\n' > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 0 ]
}

@test "conditional marker '(optional)' allows missing route" {
  printf '# agents\n' > AGENTS.md
  printf '# index\n- `optional.ts` (optional)\n' > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 0 ]
}

@test "wildcard paths are skipped" {
  printf '# agents\n' > AGENTS.md
  printf '# index\n- `docs/**/*.md`\n' > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 0 ]
}

@test "ai-index.md > 200 lines is a FAIL" {
  printf '# agents\n' > AGENTS.md
  {
    echo "# index"
    yes "line" | head -250
  } > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"docs/ai-index.md has"* ]]
}

@test "AGENTS.md > 200 lines is a FAIL" {
  yes "line" | head -250 > AGENTS.md
  printf '# index\n' > docs/ai-index.md
  AI_DOC_ROUTING_ROOT="$TEST_DIR" run node "$SCRIPT"
  [ "$status" -eq 1 ]
  [[ "$output" == *"AGENTS.md has"* ]]
}
