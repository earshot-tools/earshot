<!--
SPDX-License-Identifier: MIT
Copyright (c) 2026 Inoyatov Khamidulla and contributors.
-->

# earshot-diarizer

Local pyannote.audio sidecar for the Earshot Obsidian plugin. Reads a WAV
file, runs speaker diarization, writes JSON segments. No network at runtime
(`HF_HUB_OFFLINE=1`, `PYANNOTE_METRICS_ENABLED=0`).

## Status

**P0.S3 skeleton.** The pyannote integration lands in Phase 8 — see
[../PLAN.md](../PLAN.md). Today the CLI accepts arguments and writes an
empty-but-schema-valid result JSON.

## Quality gates

- `ruff check --select ALL` (no rule exclusions)
- `mypy --strict`
- `pytest --cov-fail-under=90 --cov-branch`
- `bandit -r earshot_diarizer/`
- `pip-audit`

Run all via `make py-quality` from the repo root.

## Development

```bash
make py-install      # creates .venv, installs dev deps
make py-quality      # runs all gates
```
