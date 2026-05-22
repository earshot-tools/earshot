"""Earshot diarizer CLI entry point.

Skeleton -- pyannote integration lands in Phase 8 per PLAN.md.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from earshot_diarizer.constants import (
    DEFAULT_DEVICE,
    DEFAULT_MAX_SPEAKERS,
    DEFAULT_MIN_SPEAKERS,
    VERSION,
)


def build_parser() -> argparse.ArgumentParser:
    """Construct the CLI argument parser.

    Returns:
        The configured :class:`argparse.ArgumentParser` for ``earshot-diarize``.
    """
    parser = argparse.ArgumentParser(
        prog="earshot-diarize",
        description="Local pyannote.audio diarizer for Earshot meeting transcripts.",
    )
    parser.add_argument("--input", type=Path, required=True, help="Path to input WAV.")
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Path to write diarization JSON.",
    )
    parser.add_argument(
        "--model-path",
        type=Path,
        required=True,
        help="Local pyannote model directory (must exist; no network at runtime).",
    )
    parser.add_argument("--min-speakers", type=int, default=DEFAULT_MIN_SPEAKERS)
    parser.add_argument("--max-speakers", type=int, default=DEFAULT_MAX_SPEAKERS)
    parser.add_argument(
        "--device",
        choices=["cpu", "mps", "cuda"],
        default=DEFAULT_DEVICE,
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"earshot-diarize {VERSION}",
    )
    return parser


def _disable_telemetry() -> None:
    """Disable pyannote telemetry and force Hugging Face into offline mode."""
    os.environ["PYANNOTE_METRICS_ENABLED"] = "0"
    os.environ["HF_HUB_OFFLINE"] = "1"


def diarize(  # noqa: PLR0913
    input_path: Path,
    output_path: Path,
    model_path: Path,
    min_speakers: int,
    max_speakers: int,
    device: str,
) -> None:
    """Run (stub) diarization and write an empty-but-schema-valid JSON.

    Pyannote integration arrives in Phase 8; for now this skeleton validates
    inputs and emits a placeholder result so the CLI contract is exercisable
    end-to-end.

    Args:
        input_path: Path to the input WAV file. Must exist.
        output_path: Path to write the JSON result. Parent dirs are created.
        model_path: Path to the local pyannote model directory. Must exist.
        min_speakers: Minimum number of speakers hint.
        max_speakers: Maximum number of speakers hint.
        device: Torch device identifier (``cpu``/``mps``/``cuda``).

    Raises:
        FileNotFoundError: If ``input_path`` or ``model_path`` does not exist.
    """
    if not input_path.exists():
        msg = f"input WAV not found: {input_path}"
        raise FileNotFoundError(msg)
    if not model_path.exists():
        msg = f"model directory not found: {model_path}"
        raise FileNotFoundError(msg)
    result = {
        "version": VERSION,
        "input": str(input_path),
        "segments": [],
        "config": {
            "min_speakers": min_speakers,
            "max_speakers": max_speakers,
            "device": device,
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    """Run the CLI entry point.

    Args:
        argv: Optional argv list (for testing). Defaults to ``sys.argv[1:]``.

    Returns:
        Process exit code (``0`` on success, ``1`` on missing input).
    """
    _disable_telemetry()
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        diarize(
            input_path=args.input,
            output_path=args.output,
            model_path=args.model_path,
            min_speakers=args.min_speakers,
            max_speakers=args.max_speakers,
            device=args.device,
        )
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)  # noqa: T201
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
