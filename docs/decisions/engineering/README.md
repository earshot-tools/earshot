# Engineering decisions

One file per decision. Filename: `E-<issue-number>.md` (or `E-<issue>-<round>.md` for multi-round decisions on the same issue).

Use the `/engineering-decision-manager` skill to add a new decision.

ENGINEERING = does **not** affect product/UX/business logic. If it affects both → HYBRID → discuss with operator before logging.

## File shape

```markdown
# E-<n> — <short title>

- **Status:** accepted | superseded by E-<m>
- **Date:** YYYY-MM-DD
- **Issue:** #<n>
- **Decided by:** <operator>

## Context

What problem we faced. What was unknown. What changed.

## Decision

The choice in one short paragraph.

## Alternatives considered

- Option A — pros / cons / why rejected
- Option B — pros / cons / why rejected

## Consequences

- What becomes easier.
- What becomes harder.
- What we must monitor.

## References

- Related findings: `docs/engineering-research/findings-<n>-<round>.md`
- Related decisions: E-<m>, D-<k>
```
