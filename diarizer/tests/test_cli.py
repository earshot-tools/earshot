"""Tests for the earshot-diarizer CLI skeleton."""

from __future__ import annotations

import json
import os
from typing import TYPE_CHECKING

import pytest
from earshot_diarizer import cli
from earshot_diarizer.constants import (
    DEFAULT_DEVICE,
    DEFAULT_MAX_SPEAKERS,
    DEFAULT_MIN_SPEAKERS,
    VERSION,
)

if TYPE_CHECKING:
    from collections.abc import Iterator
    from pathlib import Path


@pytest.fixture
def _clean_env() -> Iterator[None]:
    """Snapshot + restore env vars touched by ``_disable_telemetry``."""
    keys = ("PYANNOTE_METRICS_ENABLED", "HF_HUB_OFFLINE")
    saved = {k: os.environ.get(k) for k in keys}
    for k in keys:
        os.environ.pop(k, None)
    try:
        yield
    finally:
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def test_build_parser_required_args(tmp_path: Path) -> None:
    parser = cli.build_parser()
    args = parser.parse_args(
        [
            "--input",
            str(tmp_path / "in.wav"),
            "--output",
            str(tmp_path / "out.json"),
            "--model-path",
            str(tmp_path / "model"),
        ],
    )
    assert args.input == tmp_path / "in.wav"
    assert args.output == tmp_path / "out.json"
    assert args.model_path == tmp_path / "model"
    assert args.min_speakers == DEFAULT_MIN_SPEAKERS
    assert args.max_speakers == DEFAULT_MAX_SPEAKERS
    assert args.device == DEFAULT_DEVICE


def test_build_parser_optional_overrides(tmp_path: Path) -> None:
    parser = cli.build_parser()
    args = parser.parse_args(
        [
            "--input",
            str(tmp_path / "in.wav"),
            "--output",
            str(tmp_path / "out.json"),
            "--model-path",
            str(tmp_path / "model"),
            "--min-speakers",
            "2",
            "--max-speakers",
            "4",
            "--device",
            "mps",
        ],
    )
    assert args.min_speakers == 2
    assert args.max_speakers == 4
    assert args.device == "mps"


def test_build_parser_rejects_invalid_device(tmp_path: Path) -> None:
    parser = cli.build_parser()
    with pytest.raises(SystemExit):
        parser.parse_args(
            [
                "--input",
                str(tmp_path / "in.wav"),
                "--output",
                str(tmp_path / "out.json"),
                "--model-path",
                str(tmp_path / "model"),
                "--device",
                "tpu",
            ],
        )


@pytest.mark.usefixtures("_clean_env")
def test_disable_telemetry_sets_env() -> None:
    cli._disable_telemetry()  # noqa: SLF001
    assert os.environ["PYANNOTE_METRICS_ENABLED"] == "0"
    assert os.environ["HF_HUB_OFFLINE"] == "1"


def test_diarize_missing_input_raises(tmp_path: Path) -> None:
    model = tmp_path / "model"
    model.mkdir()
    with pytest.raises(FileNotFoundError, match="input WAV not found"):
        cli.diarize(
            input_path=tmp_path / "missing.wav",
            output_path=tmp_path / "out.json",
            model_path=model,
            min_speakers=1,
            max_speakers=2,
            device="cpu",
        )


def test_diarize_missing_model_raises(tmp_path: Path) -> None:
    wav = tmp_path / "in.wav"
    wav.write_bytes(b"RIFF")
    with pytest.raises(FileNotFoundError, match="model directory not found"):
        cli.diarize(
            input_path=wav,
            output_path=tmp_path / "out.json",
            model_path=tmp_path / "missing-model",
            min_speakers=1,
            max_speakers=2,
            device="cpu",
        )


def test_diarize_writes_expected_json(tmp_path: Path) -> None:
    wav = tmp_path / "in.wav"
    wav.write_bytes(b"RIFF")
    model = tmp_path / "model"
    model.mkdir()
    out = tmp_path / "nested" / "out.json"
    cli.diarize(
        input_path=wav,
        output_path=out,
        model_path=model,
        min_speakers=3,
        max_speakers=5,
        device="cuda",
    )
    assert out.exists()
    payload = json.loads(out.read_text(encoding="utf-8"))
    assert payload == {
        "version": VERSION,
        "input": str(wav),
        "segments": [],
        "config": {"min_speakers": 3, "max_speakers": 5, "device": "cuda"},
    }


@pytest.mark.usefixtures("_clean_env")
def test_main_success(tmp_path: Path) -> None:
    wav = tmp_path / "in.wav"
    wav.write_bytes(b"RIFF")
    model = tmp_path / "model"
    model.mkdir()
    out = tmp_path / "out.json"
    rc = cli.main(
        [
            "--input",
            str(wav),
            "--output",
            str(out),
            "--model-path",
            str(model),
        ],
    )
    assert rc == 0
    assert out.exists()
    assert os.environ["HF_HUB_OFFLINE"] == "1"


@pytest.mark.usefixtures("_clean_env")
def test_main_missing_input_returns_1(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    model = tmp_path / "model"
    model.mkdir()
    rc = cli.main(
        [
            "--input",
            str(tmp_path / "missing.wav"),
            "--output",
            str(tmp_path / "out.json"),
            "--model-path",
            str(model),
        ],
    )
    assert rc == 1
    captured = capsys.readouterr()
    assert "input WAV not found" in captured.err


def test_main_version_flag(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as excinfo:
        cli.main(["--version"])
    assert excinfo.value.code == 0
    captured = capsys.readouterr()
    assert VERSION in captured.out
