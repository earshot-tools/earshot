# Branch Strategy

## Format

```text
<area>/<type>/<issue>-<slug>
```

Examples:

```text
shared/feature/115-api-types
devops/chore/github-actions
docs/auth-guide
```

## Area prefixes

| Prefix    | Workspace                               |
| --------- | --------------------------------------- |
| `shared/` | Shared TypeScript types and Zod schemas |
| `docs/`   | Documentation only                      |
| `devops/` | Tooling, CI, infra, deploy              |

## Branch types

| Type        | When                                 | Issue # required? |
| ----------- | ------------------------------------ | ----------------- |
| `feature/`  | New functionality                    | Yes               |
| `fix/`      | Bug fix                              | Yes               |
| `refactor/` | Code restructure, no behavior change | No                |
| `chore/`    | Tooling, config, deps                | No                |
| `hotfix/`   | Urgent production fix                | Yes               |
| `release/`  | Release preparation                  | No                |

## Rules

- `main` is always deployable — never commit directly.
- One branch = one issue = one PR.
- Branch from `main`, merge to `main`.
- Delete branch after merge.
- Hotfix branches merge immediately after review.
- Issue number in branch name when applicable.
