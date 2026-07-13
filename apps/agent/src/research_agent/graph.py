"""LangGraph research agent graph."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from research_agent.nodes import (
    final_output_node,
    planner_node,
    researcher_node,
    summarizer_node,
)
from research_agent.state import ResearchState


def build_research_graph():
    """
    Build: planner -> researcher -> summarizer -> final_output
    """
    graph = StateGraph(ResearchState)
    graph.add_node("planner", planner_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("summarizer", summarizer_node)
    graph.add_node("final_output", final_output_node)

    graph.add_edge(START, "planner")
    graph.add_edge("planner", "researcher")
    graph.add_edge("researcher", "summarizer")
    graph.add_edge("summarizer", "final_output")
    graph.add_edge("final_output", END)

    return graph.compile()


def run_research_agent(goal: str) -> dict:
    """Run the research agent and return the structured final JSON dict."""
    app = build_research_graph()
    result = app.invoke({"goal": goal})
    return result.get("final_output") or {}
