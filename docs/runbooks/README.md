# Runbooks

Operational playbooks. One file per recurring or risky operation.

Each runbook is a step-by-step procedure with verification at each step.
Treat them as scripts in prose — every command should be copy-pasteable, every
check should have a known-good output.

## Suggested runbooks (add as needed)

- `local-setup.md` — fresh-machine setup for a new developer
- `database-migration.md` — how to write, test, apply a migration
- `incident-response.md` — when prod is on fire
- `release.md` — cutting a release
