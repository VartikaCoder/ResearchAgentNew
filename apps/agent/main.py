"""
Python Research Agent — FastAPI entrypoint for NestJS.

Wires POST /research to the LangGraph planner → researcher → summarizer → final_output graph.

Start (Render / local):
  uvicorn main:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
import traceback
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# Allow `from research_agent ...` when running as uvicorn main:app from apps/agent.
_SRC = Path(__file__).resolve().parent / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("research-agent")

app = FastAPI(title="Research Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    goal: str = Field(..., min_length=1, description="Research goal from NestJS")

    @field_validator("goal")
    @classmethod
    def strip_goal(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Goal cannot be empty")
        return cleaned


class Source(BaseModel):
    title: str
    url: str
    snippet: str = ""


class ResearchResponse(BaseModel):
    title: str
    summary: str
    key_findings: list[str]
    sources: list[Source]
    goal: str


def _mock_enabled() -> bool:
    return os.getenv("AGENT_MOCK", "").strip().lower() in {"1", "true", "yes"}


def _validate_env() -> None:
    missing: list[str] = []
    if not os.getenv("OPENAI_API_KEY"):
        missing.append("OPENAI_API_KEY")
    if not os.getenv("TAVILY_API_KEY") and not os.getenv("SERPAPI_API_KEY"):
        missing.append("TAVILY_API_KEY (or SERPAPI_API_KEY)")
    if missing:
        raise RuntimeError(
            "Missing required environment variables on the Python service: "
            + ", ".join(missing)
        )


def _mock_research(goal: str) -> dict:
    return {
        "title": f"Research brief: {goal}",
        "summary": (
            f"Mock research completed for: {goal}. "
            "Set AGENT_MOCK=0 and configure OPENAI_API_KEY + TAVILY_API_KEY for live research."
        ),
        "key_findings": [
            f"Goal received: {goal}",
            "Planner would generate 3–5 search queries",
            "Researcher would call Tavily/SerpAPI",
            "Summarizer would synthesize findings into this report",
        ],
        "sources": [
            {
                "title": "Mock mode",
                "url": "https://researchagentnew-3.onrender.com/health",
                "snippet": "No live web search ran (AGENT_MOCK enabled).",
            }
        ],
    }


def _run_live_research(goal: str) -> dict:
    from research_agent.graph import run_research_agent

    _validate_env()
    result = run_research_agent(goal)
    if not isinstance(result, dict) or not result:
        raise RuntimeError("Research agent returned an empty result")
    return result


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "research-agent",
        "status": "ok",
        "health": "/health",
        "research": "POST /research",
        "mode": "mock" if _mock_enabled() else "live",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "healthy",
        "mode": "mock" if _mock_enabled() else "live",
    }


@app.post("/research", response_model=ResearchResponse)
async def research(body: ResearchRequest) -> ResearchResponse:
    """Accepts {"goal": "..."} from NestJS and runs the LangGraph research agent."""
    goal = body.goal
    logger.info("Research request received (mode=%s): %s", "mock" if _mock_enabled() else "live", goal[:200])

    try:
        if _mock_enabled():
            payload = _mock_research(goal)
        else:
            # LangGraph invoke is sync/blocking — run off the event loop.
            payload = await asyncio.to_thread(_run_live_research, goal)

        sources_raw = payload.get("sources") or []
        sources = [
            Source(
                title=str(item.get("title") or "Untitled"),
                url=str(item.get("url") or ""),
                snippet=str(item.get("snippet") or "")[:500],
            )
            for item in sources_raw
            if isinstance(item, dict)
        ]

        findings = payload.get("key_findings") or []
        if not isinstance(findings, list):
            findings = [str(findings)]

        return ResearchResponse(
            title=str(payload.get("title") or f"Research brief: {goal}"),
            summary=str(payload.get("summary") or ""),
            key_findings=[str(f) for f in findings],
            sources=sources,
            goal=goal,
        )
    except RuntimeError as exc:
        logger.error("Research configuration/runtime error: %s", exc)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Research agent unavailable",
                "message": str(exc),
                "goal": goal,
            },
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.error("Research failed for goal=%r: %s", goal, exc)
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Research agent internal error",
                "message": str(exc),
                "goal": goal,
            },
        ) from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
