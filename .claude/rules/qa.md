---
paths:
  - '**/*.test.{ts,tsx,js,jsx}'
  - '**/__tests__/**'
  - '**/tests/**'
  - 'playwright.config.{ts,js}'
  - 'vitest.config.{ts,js}'
---

# QA Rules

Use for tests, accessibility, visual regression, smoke checks.

## Required reads

Before changing test files, read:

1. The issue or task instructions.
2. `AGENTS.md`.
3. The exact source files under test.
4. Existing tests for the same module to match patterns.

## Constraints

- TDD by default: write failing tests first when changing behavior.
- One assertion per test where reasonable. Group setup/teardown via `describe`/`beforeEach`.
- Tests must be deterministic. No real network calls. No real time. Use fakes/seeded RNG.
- A flaky test is a blocker, not a "retry it". Fix the source of nondeterminism or quarantine with a referenced issue.
- Coverage is a side effect of good tests, not the goal. Don't write tests to chase coverage.

## Skills

- `/work-on-issue <issue>` for generic implementation flow.
- Area-specific work skills (`/backend-work`, `/frontend-work`, `/shared-types-work`) include test conventions for that area.
