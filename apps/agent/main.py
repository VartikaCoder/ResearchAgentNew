"""
Python Research Agent — FastAPI entrypoint for NestJS.

Start (Render / local):
  uvicorn main:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import logging
import os
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

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
    snippet: str


class ResearchResponse(BaseModel):
    title: str
    summary: str
    key_findings: list[str]
    sources: list[Source]
    goal: str


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "research-agent",
        "status": "ok",
        "health": "/health",
        "research": "POST /research",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/research", response_model=ResearchResponse)
async def research(body: ResearchRequest) -> ResearchResponse:
    """
    Accepts {"goal": "..."} from NestJS and returns structured JSON.

    Nest currently uses fetch() + response.json() (not SSE), so this endpoint
    returns a complete JSON body. Wire real LangGraph work here later.
    """
    goal = body.goal
    logger.info("Research request received: %s", goal[:200])

    try:
        return ResearchResponse(
            title=f"Research brief: {goal}",
            summary=f"Preliminary research completed for: {goal}",
            key_findings=[
                f"Understood the research goal: {goal}",
                "Gathered context from the agent service",
                "Prepared a structured report for the Nest API",
            ],
            sources=[
                Source(
                    title="Research Agent",
                    url="https://researchagentnew-3.onrender.com",
                    snippet="Python FastAPI research endpoint",
                )
            ],
            goal=goal,
        )
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
