"""LLM helpers for the research agent."""

from __future__ import annotations

import os

from langchain_openai import ChatOpenAI


def get_llm(temperature: float = 0.2) -> ChatOpenAI:
    """Return a chat model configured from environment variables."""
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    return ChatOpenAI(model=model, temperature=temperature)
