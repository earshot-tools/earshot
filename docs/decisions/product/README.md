# Product decisions

One file per decision. Filename: `D-<issue-number>.md`.

Use the `/product-decision-manager` skill to add a new decision.

PRODUCT = affects product/UX/business logic. If it affects both engineering and product → HYBRID → discuss with operator before logging.

## File shape

```markdown
# D-<n> — <short title>

- **Status:** accepted | superseded by D-<m>
- **Date:** YYYY-MM-DD
- **Issue:** #<n>
- **Decided by:** <operator>

## Context

The product question. The user segment(s) affected. The constraint.

## Decision

The choice in one short paragraph.

## Alternatives considered

- Option A — pros / cons / why rejected
- Option B — pros / cons / why rejected

## Consequences

- User-facing impact.
- Operational impact.
- What we must watch for in telemetry.

## References

- Related answers: `docs/answers/<file>.md`
- Related decisions: D-<m>, E-<k>
```
