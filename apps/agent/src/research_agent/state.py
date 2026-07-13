"""Shared state for the research agent graph."""

from __future__ import annotations

from typing import Any, TypedDict


class ResearchState(TypedDict, total=False):
    """State passed between LangGraph nodes."""

    goal: str
    plan: list[str]
    research_notes: list[dict[str, Any]]
    summary: str
    final_output: dict[str, Any]
