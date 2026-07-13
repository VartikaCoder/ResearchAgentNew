"""Stream research agent progress as NDJSON lines on stdout."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import traceback
from typing import Any

from research_agent.graph import build_research_graph


def emit(event: dict[str, Any]) -> None:
    """Write one SSE-friendly event as a single NDJSON line."""
    sys.stdout.write(json.dumps(event, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def validate_env() -> None:
    missing: list[str] = []
    if not os.getenv("OPENAI_API_KEY"):
        missing.append("OPENAI_API_KEY")
    if not os.getenv("TAVILY_API_KEY") and not os.getenv("SERPAPI_API_KEY"):
        missing.append("TAVILY_API_KEY (or SERPAPI_API_KEY)")
    if missing:
        raise RuntimeError(
            "Missing required environment variables: " + ", ".join(missing)
        )


def stream_mock_research(goal: str) -> dict[str, Any]:
    """Deterministic mock stream for end-to-end UI/API testing without API keys."""
    emit({"type": "status", "message": "Starting research agent (mock mode)", "goal": goal})
    time.sleep(0.15)

    plan = [
        f"Overview of: {goal}",
        "Key approaches and tradeoffs",
        "Recent developments and sources",
    ]
    emit({"type": "node", "node": "planner", "data": {"plan": plan}})
    time.sleep(0.2)

    research_notes = [
        {
            "step": plan[0],
            "results": [
                {
                    "title": "LangGraph Documentation",
                    "url": "https://langchain-ai.github.io/langgraph/",
                    "snippet": "LangGraph orchestrates stateful multi-actor applications with LLMs.",
                    "query": plan[0],
                },
                {
                    "title": "NestJS Techniques: Server-Sent Events",
                    "url": "https://docs.nestjs.com/techniques/server-sent-events",
                    "snippet": "NestJS can stream events to clients using SSE.",
                    "query": plan[0],
                },
            ],
        },
        {
            "step": plan[1],
            "results": [
                {
                    "title": "Building research agents with tools",
                    "url": "https://python.langchain.com/docs/tutorials/agents/",
                    "snippet": "Agents combine planning, tools, and synthesis for research workflows.",
                    "query": plan[1],
                }
            ],
        },
        {
            "step": plan[2],
            "results": [
                {
                    "title": "Tavily Search for AI agents",
                    "url": "https://docs.tavily.com/",
                    "snippet": "Tavily provides search APIs optimized for LLM and agent workloads.",
                    "query": plan[2],
                }
            ],
        },
    ]
    emit({"type": "node", "node": "researcher", "data": {"research_notes": research_notes}})
    time.sleep(0.2)

    summary = (
        f"## Intermediate summary\n\n"
        f"Research on **{goal}** points to a layered pipeline: plan → search → synthesize → "
        f"structured report. Streaming progress over SSE keeps the UI responsive while the "
        f"LangGraph nodes execute."
    )
    emit({"type": "node", "node": "summarizer", "data": {"summary": summary}})
    time.sleep(0.15)

    final_output = {
        "title": f"Research brief: {goal}",
        "summary": (
            f"This mock report answers **{goal}** using a planner → researcher → "
            f"summarizer → final_output graph. In live mode, Tavily/SerpAPI and an LLM "
            f"replace these placeholders with real evidence."
        ),
        "key_findings": [
            "Break the goal into searchable steps before calling web tools.",
            "Stream node updates so the frontend can show live agent thinking.",
            "Return a typed JSON report with `title`, `key_findings`, and `sources`.",
            "Prefer Server-Sent Events for unidirectional progress + final payload delivery.",
        ],
        "sources": [
            {
                "title": "LangGraph Documentation",
                "url": "https://langchain-ai.github.io/langgraph/",
                "snippet": "Stateful multi-actor LLM orchestration framework.",
            },
            {
                "title": "NestJS Server-Sent Events",
                "url": "https://docs.nestjs.com/techniques/server-sent-events",
                "snippet": "Guidance for streaming events from NestJS APIs.",
            },
            {
                "title": "Tavily Docs",
                "url": "https://docs.tavily.com/",
                "snippet": "Search API commonly used by research agents.",
            },
        ],
    }
    emit({"type": "node", "node": "final_output", "data": {"final_output": final_output}})
    emit({"type": "result", "data": final_output})
    emit({"type": "done"})
    return final_output


def stream_research(goal: str) -> dict[str, Any]:
    if os.getenv("AGENT_MOCK", "").strip().lower() in {"1", "true", "yes"}:
        return stream_mock_research(goal)

    validate_env()
    emit({"type": "status", "message": "Starting research agent", "goal": goal})

    app = build_research_graph()
    final_output: dict[str, Any] = {}

    for update in app.stream({"goal": goal}, stream_mode="updates"):
        for node_name, node_data in update.items():
            payload = node_data if isinstance(node_data, dict) else {"value": node_data}
            emit({"type": "node", "node": node_name, "data": payload})
            if node_name == "final_output" and isinstance(node_data, dict):
                final_output = node_data.get("final_output") or {}

    if not final_output:
        raise RuntimeError("Research agent finished without a final_output payload")

    emit({"type": "result", "data": final_output})
    emit({"type": "done"})
    return final_output


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Stream research agent events as NDJSON")
    parser.add_argument("--goal", required=True, help="Research goal")
    args = parser.parse_args(argv)

    goal = args.goal.strip()
    if not goal:
        emit({"type": "error", "message": "Goal must be a non-empty string"})
        return 1

    try:
        stream_research(goal)
        return 0
    except Exception as exc:  # noqa: BLE001 - surface all failures to the API
        emit(
            {
                "type": "error",
                "message": str(exc),
                "detail": traceback.format_exc(),
            }
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
