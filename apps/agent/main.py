#!/usr/bin/env python3
"""Local test runner for the research agent."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Ensure src/ is importable when running: python main.py
ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

load_dotenv(ROOT / ".env")

from research_agent import run_research_agent  # noqa: E402

SAMPLE_GOAL = (
    "Compare the main approaches to building multi-agent research systems "
    "with LangGraph in 2025–2026, including tradeoffs and common tooling."
)


def main() -> None:
    goal = " ".join(sys.argv[1:]).strip() or SAMPLE_GOAL

    missing = []
    if not os.getenv("OPENAI_API_KEY"):
        missing.append("OPENAI_API_KEY")
    if not os.getenv("TAVILY_API_KEY") and not os.getenv("SERPAPI_API_KEY"):
        missing.append("TAVILY_API_KEY (or SERPAPI_API_KEY)")
    if missing:
        print("Missing required environment variables:")
        for name in missing:
            print(f"  - {name}")
        print("\nCopy .env.example to .env and fill in your keys, then retry.")
        sys.exit(1)

    print(f"Goal: {goal}\n")
    print("Running research agent (planner → researcher → summarizer → final_output)...\n")

    result = run_research_agent(goal)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
