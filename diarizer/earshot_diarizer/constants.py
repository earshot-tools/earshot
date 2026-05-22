"""Project-wide constants for the Earshot diarizer.

All numeric constants live here per the project's ``no_scattered_constants``
convention (see PLAN.md, Ferrari quality gates section).
"""

VERSION: str = "0.1.0"
DEFAULT_MIN_SPEAKERS: int = 1
DEFAULT_MAX_SPEAKERS: int = 8
DEFAULT_DEVICE: str = "cpu"
SAMPLE_RATE_HZ: int = 16_000
