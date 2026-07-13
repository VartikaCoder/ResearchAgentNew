"""Pydantic models for structured research output."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Source(BaseModel):
    title: str = Field(description="Source title")
    url: str = Field(description="Source URL")
    snippet: str = Field(default="", description="Short excerpt from the source")


class ResearchPlan(BaseModel):
    steps: list[str] = Field(
        description="Ordered research steps / search queries to investigate the goal"
    )


class ResearchSummary(BaseModel):
    overview: str = Field(description="Concise overview of what was learned")
    key_points: list[str] = Field(description="Bullet-style key points from research")


class FinalResearchOutput(BaseModel):
    title: str = Field(description="Clear title for the research report")
    key_findings: list[str] = Field(description="Most important findings")
    sources: list[Source] = Field(description="Cited sources used in the research")
    summary: str = Field(description="Short narrative summary of the research")
