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
.PHONY: format format-check lint lint-fix type-check test test-coverage knip jscpd md-lint license-check audit dedupe-check size-limit test-shell yamllint flaky-check ci-local
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
	@files=$$(find tools scripts bin -maxdepth 2 -type f -name "*.sh" 2>/dev/null); \
	  if [ -z "$$files" ]; then echo "test-shell: no shell scripts found"; exit 0; fi; \
	  echo "Checking: $$files"; shellcheck $$files

yamllint: ## yamllint on .github + lefthook.yml.
	@if ! command -v yamllint >/dev/null 2>&1; then echo "yamllint not installed: brew install yamllint" && exit 1; fi
	yamllint -c .yamllint .github/ lefthook.yml

flaky-check: ## Fail if any vitest run had retries (post-test).
	pnpm flaky:check

ci-local: format-check lint md-lint knip jscpd license-check audit dedupe-check test-shell yamllint type-check test-coverage flaky-check ## Mirror of CI gates locally.

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
	cd native/EarshotCapture && DYLD_FRAMEWORK_PATH=/Library/Developer/CommandLineTools/usr/lib swiftlint lint --config ../../.swiftlint.yml --strict --quiet

swift-analyze: ## swiftlint analyze (requires compile_commands.json — emitted by swift build).
	@if ! command -v swiftlint >/dev/null 2>&1; then echo "ERROR: swiftlint not installed: brew install swiftlint" && exit 1; fi
	@cd native/EarshotCapture && swift build --build-tests > /dev/null 2>&1 || true
	@cd native/EarshotCapture && [ -f compile_commands.json ] || { echo "Skipping analyze: no compile_commands.json"; exit 0; }
	cd native/EarshotCapture && DYLD_FRAMEWORK_PATH=/Library/Developer/CommandLineTools/usr/lib swiftlint analyze --config ../../.swiftlint.yml --strict --compile-commands compile_commands.json

swift-quality: swift-format-check swift-lint swift-build swift-test ## Full Swift Ferrari gate sweep (macOS only).


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
