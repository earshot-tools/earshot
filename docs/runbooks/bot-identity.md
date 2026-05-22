# Bot identity in worktrees

This project enforces commits authored from a git worktree under
`.claude/worktrees/` to use the bot identity `stivoo-bot`. The check runs
in lefthook's `pre-commit` hook.

## Why

When an AI agent works in a parallel worktree, the commits should be
attributable to the bot account, not to the human operator. This keeps the
commit log clean and makes it easy to spot which commits were AI-driven.

## Setup

In each worktree under `.claude/worktrees/`, set the bot identity once:

```bash
git config --worktree user.name 'stivoo-bot'
git config --worktree user.email 'stivoo-bot@users.noreply.github.com'
```

If you create worktrees with `make worktree-create` (the recommended path),
the wrapper sets this automatically.

## Disabling

Set `BOT_NAME=` (empty) at scaffold time and re-scaffold the project, or edit
`lefthook.yml` and remove the `bot-identity` job.
