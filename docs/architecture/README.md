# Architecture

System-level docs that describe how pieces fit together, not what individual files do.

Each architecture doc focuses on one cross-cutting concern: auth, data model, deployment topology, telemetry pipeline, multi-tenancy, etc.

Use `/architecture` to run a deterministic principal-engineer session before adding a new architecture doc.

## Typical contents

- Context: the problem this architecture solves.
- Components: what exists, what's added.
- Diagrams (text or `.svg`/`.png` files).
- Data flow.
- Failure modes and fallback behavior.
- Related decisions: E-XXXX, D-XXXX.
