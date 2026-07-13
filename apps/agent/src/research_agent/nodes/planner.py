"""Planner node — break the user goal into research steps."""

from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from research_agent.llm import get_llm
from research_agent.models import ResearchPlan
from research_agent.state import ResearchState


PLANNER_SYSTEM = """You are a research planner.
Given a user research goal, produce 3-5 concrete, searchable investigation steps.
Each step should be a focused query or investigation angle that can be answered via web search.
Prefer specific, high-signal queries over vague topics.
Do not invent facts — only plan what to research.
"""


def planner_node(state: ResearchState) -> dict:
    goal = state["goal"]
    llm = get_llm(temperature=0.1).with_structured_output(ResearchPlan)
    plan: ResearchPlan = llm.invoke(
        [
            SystemMessage(content=PLANNER_SYSTEM),
            HumanMessage(content=f"Research goal:\n{goal}"),
        ]
    )
    return {"plan": plan.steps}
