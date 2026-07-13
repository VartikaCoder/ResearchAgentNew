"""Final output node — emit clean structured JSON for the caller."""

from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, SystemMessage

from research_agent.llm import get_llm
from research_agent.models import FinalResearchOutput, Source
from research_agent.state import ResearchState


FINAL_SYSTEM = """You are a research report formatter.
Produce a structured final research report with:
- title
- key_findings (distinct, evidence-backed bullets)
- sources (title, url, snippet) from the research notes only
- summary (short narrative)

Only cite sources that appear in the research notes.
Return high-quality, concise findings tied to the original goal.
"""


def _collect_sources(notes: list[dict]) -> list[Source]:
    seen: set[str] = set()
    sources: list[Source] = []
    for note in notes:
        for item in note.get("results") or []:
            url = (item.get("url") or "").strip()
            if not url or url in seen:
                continue
            seen.add(url)
            sources.append(
                Source(
                    title=item.get("title") or "Untitled",
                    url=url,
                    snippet=(item.get("snippet") or "")[:400],
                )
            )
    return sources


def final_output_node(state: ResearchState) -> dict:
    goal = state["goal"]
    summary = state.get("summary") or ""
    notes = state.get("research_notes") or []
    known_sources = _collect_sources(notes)

    llm = get_llm(temperature=0.1).with_structured_output(FinalResearchOutput)
    report: FinalResearchOutput = llm.invoke(
        [
            SystemMessage(content=FINAL_SYSTEM),
            HumanMessage(
                content=(
                    f"Research goal:\n{goal}\n\n"
                    f"Draft summary:\n{summary}\n\n"
                    f"Available sources (JSON):\n"
                    f"{json.dumps([s.model_dump() for s in known_sources], indent=2)}\n\n"
                    f"Raw research notes (JSON):\n"
                    f"{json.dumps(notes, indent=2, ensure_ascii=False)}"
                )
            ),
        ]
    )

    # Prefer model-selected sources, but fall back to collected sources if empty.
    if not report.sources and known_sources:
        report.sources = known_sources[:10]

    return {"final_output": report.model_dump()}
