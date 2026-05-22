---
name: work-on-issue
description: Work on a GitHub issue end-to-end. Pulls latest main, reads issue, plans implementation or research, uses TDD for code changes, merges to main. Use when the user says /work-on-issue followed by an issue number.
argument-hint: <issue-number>
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob Agent
---

# Work on Issue

## Goal

Take a GitHub issue from start to finish with staff-level rigor: assess, plan, implement (TDD), verify, merge.

## Pre-flight checklist

- [ ] Working tree clean (`git status`).
- [ ] On `main`, pulled latest.
- [ ] Issue exists and is assigned (or claimable) by the operator.
- [ ] Required decisions for the slice are logged (E-XXXX, D-XXXX as applicable).

If any pre-flight fails, stop and resolve before continuing.

## Workflow

1. **Read context.** Issue body + linked decisions + routed docs from `docs/ai-index.md` + exact source files in scope.
2. **Classify the work.** Is this an implementation issue (clear acceptance criteria + bounded files) or a research/architecture issue? If the latter, switch to `/architecture` or `/generate-research-brief`.
3. **Plan.** Write a short plan in the issue comment OR in `.tmp/plan-<issue>.md`. Cover:
   - Files to change.
   - Tests to add first (TDD).
   - Risk + rollback.
4. **Branch.** `make branch-feature AREA=<area> ISSUE=<n> SLUG=<slug>` or equivalent.
5. **TDD.** Write failing test → make it pass → refactor. Small steps.
6. **Local gates.** `make ci-local` (Prettier, lint, type-check, test) before pushing.
7. **PR.** `make pr-create TITLE="..." BODY_FILE=.tmp/pr-<issue>.md`.
8. **Review fixes.** Address every reviewer comment with a code change or a written reason. Use the `/code-review` skill as a self-review pass before requesting human review.
9. **Merge.** Squash-merge after green CI + approval. Delete branch.
10. **Close.** Verify the issue closed via `Closes #<n>` in the PR body. Update any related decisions or follow-up ideas.

## Stop gates

- Acceptance criteria not testable → ask operator to revise the issue.
- Issue requires a security/auth/data/API decision that is not logged → route to `/architecture`.
- Issue overlaps an in-flight branch → coordinate with the operator before continuing.

## Skills

- `/architecture` for large or cross-area work.
- Area-specific work skills (`/backend-work`, `/frontend-work`, `/shared-types-work`, `/web-work`, `/devops-work`) when stack-specific context is needed.
- `/code-review` for self-review before pushing.
