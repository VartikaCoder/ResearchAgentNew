"""Researcher node — execute planned searches with a web search tool."""

from __future__ import annotations

from research_agent.state import ResearchState
from research_agent.tools.search import web_search


def researcher_node(state: ResearchState) -> dict:
    plan = state.get("plan") or []
    notes: list[dict] = []

    for step in plan:
        try:
            results = web_search(step, max_results=4)
        except Exception as exc:  # noqa: BLE001 - surface tool errors in notes
            notes.append(
                {
                    "step": step,
                    "error": str(exc),
                    "results": [],
                }
            )
            continue

        notes.append(
            {
                "step": step,
                "results": results,
            }
        )

    return {"research_notes": notes}
