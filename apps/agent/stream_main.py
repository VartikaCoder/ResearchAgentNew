#!/usr/bin/env python3
"""NDJSON stream entrypoint for the NestJS API (and local debugging)."""

from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

load_dotenv(ROOT / ".env")

from research_agent.stream_cli import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
