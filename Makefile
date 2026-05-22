# earshot — workflow command allowlist.

SHELL := /bin/bash
.DEFAULT_GOAL := help

LICENSE_ALLOWLIST := MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;CC0-1.0;Unlicense;0BSD;BlueOak-1.0.0;Python-2.0;MPL-2.0;OFL-1.1

# ─── Help ─────────────────────────────────────────────────────────────
.PHONY: help
help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ─── Install / setup ──────────────────────────────────────────────────
.PHONY: install
install: ## Install all workspace deps + lefthook hooks.
	pnpm install

# ─── Quality gates ────────────────────────────────────────────────────
.PHONY: format format-check lint lint-fix type-check test test-coverage knip jscpd md-lint license-check audit dedupe-check size-limit stylelint stylelint-fix stryker stryker-plugin stryker-shared inline-suppressions branch-name-check gitleaks secretlint depcruise openapi-check openapi-lint test-shell yamllint flaky-check codebase-check pr-checks ai-doc-routing skill-content-check skill-content-update test-bats ci-local
format: ## Run Prettier in write mode.
	pnpm format

format-check: ## Run Prettier in check mode.
	pnpm format:check

lint: ## Run lint per workspace (max-warnings 0).
	pnpm lint

lint-fix: ## Run lint --fix per workspace.
	pnpm lint:fix

type-check: ## Run tsc --noEmit per workspace.
	pnpm type-check

test: ## Run tests per workspace.
	pnpm test

test-coverage: ## Run tests with coverage (100/100/100/100 threshold).
	pnpm test:coverage

knip: ## Detect unused exports / files / deps.
	pnpm knip

jscpd: ## Detect copy-pasted code.
	pnpm jscpd

md-lint: ## Lint all Markdown.
	pnpm md-lint

license-check: ## License allowlist gate.
	pnpm license-check

audit: ## pnpm audit at moderate level.
	pnpm audit

dedupe-check: ## Reject duplicate transitive deps.
	pnpm dedupe:check

test-shell: ## Shellcheck on bin/ + tools/ + scripts/ shell.
	@if ! command -v shellcheck >/dev/null 2>&1; then echo "shellcheck not installed: brew install shellcheck" && exit 1; fi
	@sh_files=$$(find tools scripts bin -maxdepth 2 -type f -name "*.sh" 2>/dev/null); \
	  bin_files=$$(find bin -maxdepth 1 -type f ! -name "*.sh" 2>/dev/null \
	    | while read -r f; do head -1 "$$f" | grep -qE '^#!.*(bash|sh)' && echo "$$f"; done); \
	  files="$$sh_files $$bin_files"; \
	  files=$$(echo "$$files" | xargs -n1 2>/dev/null | sed '/^$$/d'); \
	  if [ -z "$$files" ]; then echo "test-shell: no shell scripts found"; exit 0; fi; \
	  echo "Checking:"; echo "$$files"; shellcheck $$files

yamllint: ## yamllint on .github + lefthook.yml.
	@if ! command -v yamllint >/dev/null 2>&1; then echo "yamllint not installed: brew install yamllint" && exit 1; fi
	yamllint -c .yamllint .github/ lefthook.yml

flaky-check: ## Fail if any vitest run had retries (post-test).
	pnpm flaky:check

size-limit: ## Build production main.js and enforce the 250KB gzipped budget.
	pnpm run size

stylelint: ## Lint CSS with stylelint (no exclusions beyond build artifacts).
	pnpm run stylelint

stylelint-fix: ## Apply stylelint --fix to all CSS.
	pnpm run stylelint:fix

stryker: stryker-plugin stryker-shared ## Mutation testing across all workspaces.

stryker-plugin: ## Mutation testing on plugin/ (currently scoring 100%).
	cd plugin && pnpm exec stryker run

stryker-shared: ## Mutation testing on shared/ (scaffolded tests; expected to score low — see ADR E-004).
	cd shared && pnpm exec stryker run

inline-suppressions: ## Reject new eslint-disable / @ts-expect-error / # noqa lines without reviewer bypass.
	node scripts/check-inline-suppressions.mjs

codebase-check: ## Full-tree static analysis on plugin/src + shared/src (ports asal-world #525).
	bash scripts/codebase-check.sh

pr-checks: ## PR-violation audit (A1/A2/A7/A8/A9/A10) — usage: make pr-checks PR=<n> | make pr-checks PR=local.
	@if [ -z "$(PR)" ]; then echo "Usage: make pr-checks PR=<number|local>"; exit 1; fi
	bash scripts/pr-checks.sh $(PR)

ai-doc-routing: ## Verify AGENTS.md + docs/ai-index.md routing targets exist (ports asal-world).
	node scripts/check-ai-doc-routing.mjs

skill-content-check: ## Verify .claude/skills/ have not drifted from the committed manifest.
	bash scripts/check-skill-content.sh

skill-content-update: ## Regenerate the .claude/skills manifest after an intentional edit.
	bash scripts/check-skill-content.sh update

test-bats: ## Run bats-core tests for the gate scripts.
	@if ! command -v bats >/dev/null 2>&1; then echo "bats not installed: brew install bats-core" && exit 1; fi
	bats scripts/__tests__/

gitleaks: ## Full-repo gitleaks scan (lefthook covers staged-only; this covers history).
	@if ! command -v gitleaks >/dev/null 2>&1; then echo "ERROR: gitleaks not installed: brew install gitleaks"; exit 1; fi
	gitleaks detect --no-banner --redact

secretlint: ## Full-repo secretlint scan (lefthook covers staged-only via lint-staged).
	pnpm exec secretlint --maskSecrets "**/*"

depcruise: ## Run dependency-cruiser per workspace (plugin + shared).
	cd plugin && pnpm run depcruise
	cd shared && pnpm run depcruise

openapi-check: ## OpenAPI drift check (regenerates and compares).
	pnpm openapi:check

openapi-lint: ## OpenAPI spectral lint.
	pnpm openapi:lint

branch-name-check: ## Enforce phase/<n>-... or <area>/feature|fix/... branch naming.
	@BR="$${GITHUB_HEAD_REF:-$$(git symbolic-ref --short HEAD 2>/dev/null || echo HEAD)}"; \
	  case "$$BR" in \
	    main|master|HEAD) echo "branch-name-check: on '$$BR' (allowed / detached)"; exit 0;; \
	    phase/*) echo "OK: $$BR (phase branch)"; exit 0;; \
	    plugin/*|shared/*|native/*|diarizer/*|devops/*|docs/*|deps/*) echo "OK: $$BR (scoped branch)"; exit 0;; \
	  esac; \
	  echo "ERROR: branch '$$BR' must match phase/<N>-<slug> OR <area>/feature|fix/<issue>-<slug>"; \
	  echo "       allowed area prefixes: plugin shared native diarizer devops docs deps"; \
	  exit 1

ci-local: format-check lint md-lint knip jscpd license-check audit dedupe-check test-shell yamllint type-check test-coverage flaky-check py-quality size-limit stylelint gitleaks secretlint depcruise openapi-check openapi-lint inline-suppressions branch-name-check codebase-check ai-doc-routing skill-content-check test-bats ## Mirror of CI gates locally (py-quality requires `make py-install` first; gitleaks requires brew install gitleaks).

# ─── Swift gates (macOS only — Swift toolchain not available on ubuntu CI runner) ───
.PHONY: swift-build swift-test swift-format-check swift-format swift-lint swift-analyze swift-quality
swift-build: ## Build the native helper in release mode.
	cd native/EarshotCapture && bash scripts/build_release.sh

swift-test: ## Run Swift Testing suite for the native helper.
	cd native/EarshotCapture && swift test

swift-format-check: ## swift-format lint --strict on Sources/ + Tests/.
	cd native/EarshotCapture && swift format lint --strict --recursive Sources Tests

swift-format: ## swift-format format --in-place on Sources/ + Tests/.
	cd native/EarshotCapture && swift format format --in-place --recursive Sources Tests

swift-lint: ## swiftlint --strict against the entire native package.
	@if ! command -v swiftlint >/dev/null 2>&1; then echo "ERROR: swiftlint not installed: brew install swiftlint" && exit 1; fi
	cd native/EarshotCapture && DYLD_FRAMEWORK_PATH=/Library/Developer/CommandLineTools/usr/lib swiftlint lint --config ../../.swiftlint.yml --strict --quiet

swift-analyze: ## swiftlint analyze (requires compile_commands.json — emitted by swift build).
	@if ! command -v swiftlint >/dev/null 2>&1; then echo "ERROR: swiftlint not installed: brew install swiftlint" && exit 1; fi
	@cd native/EarshotCapture && if ! swift build --build-tests 2> /tmp/earshot-swift-analyze-build.log > /dev/null; then \
	  echo "ERROR: swift build --build-tests failed (required for swiftlint analyze):"; \
	  cat /tmp/earshot-swift-analyze-build.log; \
	  exit 1; \
	fi
	@cd native/EarshotCapture && if [ ! -f compile_commands.json ]; then \
	  echo "Skipping analyze: swift build did not emit compile_commands.json (SwiftPM/CLT quirk)"; \
	  exit 0; \
	else \
	  DYLD_FRAMEWORK_PATH=/Library/Developer/CommandLineTools/usr/lib swiftlint analyze --config ../../.swiftlint.yml --strict --compile-commands compile_commands.json; \
	fi

swift-quality: swift-format-check swift-lint swift-build swift-test ## Full Swift Ferrari gate sweep (macOS only).

# ─── Python gates (cross-platform) ──────────────────────────────────────
# NOTE: All py-* targets require `make py-install` first (creates diarizer/.venv).
# `py-quality` is included in `ci-local`'s prerequisite chain below.
# `py-audit` is intentionally NOT in `py-quality` / `ci-local`: it needs
# network. We'll wire it as a separate scheduled audit-deps job.
.PHONY: py-install py-lint py-format py-format-check py-typecheck py-test py-audit py-bandit py-quality
PYTHON ?= python3.12
DIARIZER_VENV := diarizer/.venv

py-install: ## Create diarizer/.venv and install runtime + dev deps.
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo "ERROR: $(PYTHON) not installed (brew install python@3.12)"; exit 1; }
	$(PYTHON) -m venv $(DIARIZER_VENV)
	$(DIARIZER_VENV)/bin/pip install --upgrade pip
	$(DIARIZER_VENV)/bin/pip install -e "diarizer[dev]"

py-lint: ## ruff check --select ALL (no exclusions).
	$(DIARIZER_VENV)/bin/ruff check --no-fix diarizer/earshot_diarizer diarizer/tests

py-format: ## ruff format auto-fix.
	$(DIARIZER_VENV)/bin/ruff format diarizer/earshot_diarizer diarizer/tests

py-format-check: ## ruff format --check (CI-strict, no auto-fix).
	$(DIARIZER_VENV)/bin/ruff format --check diarizer/earshot_diarizer diarizer/tests

py-typecheck: ## mypy --strict across earshot_diarizer + tests.
	cd diarizer && .venv/bin/mypy --strict earshot_diarizer tests

py-test: ## pytest with coverage + 90% threshold.
	cd diarizer && .venv/bin/pytest

py-bandit: ## bandit security scan.
	$(DIARIZER_VENV)/bin/bandit -r diarizer/earshot_diarizer -ll

py-audit: ## pip-audit on the diarizer's dependencies (NETWORK; not in ci-local).
	$(DIARIZER_VENV)/bin/pip-audit -r <($(DIARIZER_VENV)/bin/pip freeze) || $(DIARIZER_VENV)/bin/pip-audit

py-quality: py-format-check py-lint py-typecheck py-test py-bandit ## Full Python Ferrari gate sweep.


# ─── Branching / issues / PRs ─────────────────────────────────────────
.PHONY: branch-feature branch-fix worktree-create worktree-remove worktree-list issues issue-view issue-create pr-create push-branch git-status git-pull git-fetch git-log git-diff
branch-feature: ## AREA=<a> ISSUE=<n> SLUG=<s>
	@test -n "$(AREA)" || (echo "AREA is required" && exit 1)
	@test -n "$(ISSUE)" || (echo "ISSUE is required" && exit 1)
	@test -n "$(SLUG)" || (echo "SLUG is required" && exit 1)
	git switch -c $(AREA)/feature/$(ISSUE)-$(SLUG)

branch-fix: ## AREA=<a> ISSUE=<n> SLUG=<s>
	@test -n "$(AREA)" || (echo "AREA is required" && exit 1)
	@test -n "$(ISSUE)" || (echo "ISSUE is required" && exit 1)
	@test -n "$(SLUG)" || (echo "SLUG is required" && exit 1)
	git switch -c $(AREA)/fix/$(ISSUE)-$(SLUG)

worktree-create: ## BRANCH=<branch>
	@test -n "$(BRANCH)" || (echo "BRANCH is required" && exit 1)
	mkdir -p .claude/worktrees
	git worktree add .claude/worktrees/$$(echo $(BRANCH) | tr '/' '-') $(BRANCH)
	cd .claude/worktrees/$$(echo $(BRANCH) | tr '/' '-') && git config --worktree user.name 'stivoo-bot'
	cd .claude/worktrees/$$(echo $(BRANCH) | tr '/' '-') && git config --worktree user.email 'stivoo-bot@users.noreply.github.com'

worktree-remove: ## BRANCH=<branch>
	@test -n "$(BRANCH)" || (echo "BRANCH is required" && exit 1)
	git worktree remove .claude/worktrees/$$(echo $(BRANCH) | tr '/' '-')

worktree-list: ## List all worktrees
	git worktree list

issues: ## List open issues. SEARCH=<filter>
	gh issue list $(if $(SEARCH),--search "$(SEARCH)")

issue-view: ## N=<n>
	@test -n "$(N)" || (echo "N is required" && exit 1)
	gh issue view $(N)

issue-create: ## TITLE="..." BODY_FILE=.tmp/body.md [LABELS=a,b]
	@test -n "$(TITLE)" || (echo "TITLE is required" && exit 1)
	@test -n "$(BODY_FILE)" || (echo "BODY_FILE is required" && exit 1)
	gh issue create --title "$(TITLE)" --body-file "$(BODY_FILE)" $(if $(LABELS),--label "$(LABELS)")

pr-create: ## TITLE="..." BODY_FILE=.tmp/pr-body.md [BASE=main]
	@test -n "$(TITLE)" || (echo "TITLE is required" && exit 1)
	@test -n "$(BODY_FILE)" || (echo "BODY_FILE is required" && exit 1)
	gh pr create --title "$(TITLE)" --body-file "$(BODY_FILE)" --base $(or $(BASE),main)

push-branch: ## Push current branch to origin
	git push -u origin $$(git symbolic-ref --short HEAD)

.PHONY: repo-init required-checks
required-checks: ## Print the required-checks list derived from .github/workflows.
	@node scripts/required-checks.mjs

repo-init: ## Apply branch protection to main (requires `gh auth login` + admin). Idempotent.
	@command -v gh >/dev/null 2>&1 || { echo "gh CLI not installed: brew install gh" && exit 1; }
	@CHECKS=$$(node scripts/required-checks.mjs --gh); \
	  echo "Required checks: $$(node scripts/required-checks.mjs | tr '\n' ',' | sed 's/,$$//')"; \
	  eval gh api -X PUT \"repos/earshot-tools/earshot/branches/main/protection\" \
	    -F required_status_checks[strict]=true \
	    $$CHECKS \
	    -F required_pull_request_reviews[required_approving_review_count]=1 \
	    -F required_pull_request_reviews[dismiss_stale_reviews]=true \
	    -F enforce_admins=true \
	    -F restrictions= \
	    -F allow_force_pushes=false \
	    -F allow_deletions=false

git-status:
	git status
git-pull:
	git pull --ff-only origin main
git-fetch:
	git fetch --all --prune
git-log: ## N=<count>
	git log --oneline -n $(or $(N),20)
git-diff:
	git diff
