# Agentic Issue Slicing

How to turn large architecture work into GitHub specs, epics, and child issues that an AI agent can implement without guessing or expanding scope.

## Role split

**Architect (Claude Code / long-context):**

- Long-context discussion with the operator.
- Architecture and design specs.
- Options with pros, cons, risks, and recommendation.
- Decision logging.
- Epic and child issue decomposition.

**Implementer (Codex / bounded agent):**

- One child issue.
- One branch.
- One PR.
- Runs checks.
- Fixes review findings.

Issue format should be agent-neutral but implementer-sized. If a bounded agent can't implement it without huge context, the issue is too large and belongs back in spec/planning.

## Big-work flow

1. Architect + operator run a principal-engineer discussion (see `/architecture` skill).
2. Architect writes the spec directly in a branch/worktree.
3. Spec presents meaningful options with pros, cons, risks, convention fit, recommendation, and the operator's decision.
4. Architect creates an epic + child-issue breakdown from the accepted spec.
5. Execution starts only from child issues.
6. Implementer takes one child issue per branch/PR.

For trivial convention-following choices, cite the existing convention or decision instead of manufacturing fake options.

## Child-issue contract

Each child issue must include:

- **Description** — what to build.
- **Why** — link to D-XXXX / E-XXXX or short rationale.
- **Acceptance criteria** — bulleted, testable.
- **Out of scope** — what this issue explicitly does NOT cover.
- **Test plan** — unit, integration, manual.
- **Files touched (estimate)** — bounded list.

Reject any child issue that:

- Reads as "do everything in area X" without a bounded file list.
- Requires the implementer to invent product decisions.
- Has unresolved security/auth/data-model decisions blocking it.

## GitHub planning surface

- Parent work: GitHub issue with sub-issues.
- Implementation slice: GitHub sub-issue or child issue, one branch, one PR.
- Execution board: GitHub Projects board with status fields.
- Decisions: file-per-decision under `docs/decisions/engineering/` and `docs/decisions/product/`.
- Research: brief + findings under `docs/engineering-research/`.

## Gate before opening a child issue

The architect must answer YES to all of these before creating the issue:

- Product/UX decisions for this slice are logged (D-XXXX).
- Engineering decisions for this slice are logged (E-XXXX).
- External engineering facts (versions, benchmarks, protocol support) are gathered or N/A.
- Acceptance criteria are testable.
- A reasonable file-touch estimate exists.

If any answer is NO, the gap goes back to the decision/research flow, not the implementer's lap.
