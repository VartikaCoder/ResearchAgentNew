"""Summarizer node — synthesize research notes into an overview."""

from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, SystemMessage

from research_agent.llm import get_llm
from research_agent.models import ResearchSummary
from research_agent.state import ResearchState


SUMMARIZER_SYSTEM = """You are a research analyst.
Synthesize the provided web research notes into a clear overview and key points.
Base your summary only on the supplied notes. If evidence is weak or missing, say so.
Do not invent sources or facts.
"""


def _format_notes(notes: list[dict]) -> str:
    return json.dumps(notes, indent=2, ensure_ascii=False)


def summarizer_node(state: ResearchState) -> dict:
    goal = state["goal"]
    notes = state.get("research_notes") or []
    llm = get_llm(temperature=0.2).with_structured_output(ResearchSummary)
    summary: ResearchSummary = llm.invoke(
        [
            SystemMessage(content=SUMMARIZER_SYSTEM),
            HumanMessage(
                content=(
                    f"Research goal:\n{goal}\n\n"
                    f"Research notes (JSON):\n{_format_notes(notes)}"
                )
            ),
        ]
    )
    # Keep a single narrative string in state for the final node,
    # while still capturing structured key points inside that string.
    narrative = summary.overview
    if summary.key_points:
        bullets = "\n".join(f"- {point}" for point in summary.key_points)
        narrative = f"{summary.overview}\n\nKey points:\n{bullets}"
    return {"summary": narrative}
