# Commit Message Convention

## Format

```text
type(scope): subject line (max 72 chars)

## Why
Motivation for the change.

## What
- Bullet points of changes.

## Decisions
- D-XXXX, E-XXXX references.

## Trade-offs
- What was considered and rejected.

## Risks
- Impact on existing functionality. "None" if safe.

## Testing
- How it was verified.

## Rollback
- Safe to revert / feature toggle / requires migration / fix forward.

## Not included
- What's intentionally out of scope.

Closes #105
```

## Types

| Type       | When                        |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `test`     | Adding/fixing tests         |
| `refactor` | Code change, no feature/fix |
| `docs`     | Documentation only          |
| `chore`    | Tooling, config, deps       |
| `style`    | Formatting                  |
| `perf`     | Performance improvement     |
| `ci`       | CI/CD pipeline changes      |
| `build`    | Build system changes        |
| `revert`   | Reverting a previous commit |

## Scopes

| Scope    | Workspace            |
| -------- | -------------------- |
| `shared` | Shared types/schemas |
| `devops` | CI / infra / tooling |
| `docs`   | Documentation        |

## Rules

- Lowercase everything.
- Max 72 chars subject line.
- Imperative mood: "add" not "added".
- Reference issue: `feat(server): add health endpoint (#105)`.
- Breaking changes: add `!` after scope: `feat(api)!: change auth response shape`.
- `feat` and `fix` require body with `## Why` and `## What` sections.
- `chore`, `docs`, `test` — subject + brief body is enough.

## Rollback categories

- **Safe to revert** — no side effects, just revert the commit.
- **Feature toggle** — turn off toggle, code stays deployed but inactive.
- **Requires migration** — needs a reverse migration script.
- **Fix forward** — cannot revert cleanly; ship a fix instead.
