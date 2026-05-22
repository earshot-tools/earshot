# SPDX-License-Identifier: MIT
# Earshot — declarative Homebrew bundle for the developer environment.
#
# Usage:
#   brew bundle install
#   brew bundle check --verbose
#
# After this, run `bin/setup` to wire the pnpm + venv + lefthook layers.

# Languages / runtimes ---------------------------------------------------------
brew "node@24"
brew "python@3.12"

# Package manager (Corepack-shimmed via pnpm@10 below; brew install is the
# canonical path if the user doesn't enable corepack).
brew "pnpm"

# Native helper toolchain (Swift comes from CLT or Xcode separately).
brew "swiftlint"
brew "swift-format"
brew "periphery"

# Quality-gate CLIs that `make ci-local` shells out to.
brew "gitleaks"
brew "shellcheck"
brew "yamllint"

# Shell-test framework for the gate scripts (scripts/__tests__/*.bats).
# Without these tests, gate-script bugs ship silently — every fix to
# pr-checks.sh / codebase-check.sh / check-inline-suppressions.mjs in
# Phase 0 was caught by hand-testing, never by a test.
brew "bats-core"

# Local STT runtime (Phase 3 will exercise this).
brew "ollama"

# Convenience: GitHub CLI for PR/issue automation.
brew "gh"

# Mutation testing reports (HTML viewer; optional).
# brew "lighthouse"

# Git LFS for the (eventual) pyannote model assets.
brew "git-lfs"
