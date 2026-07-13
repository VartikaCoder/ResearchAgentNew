"""Web search tools (Tavily preferred, SerpAPI optional fallback)."""

from __future__ import annotations

import os
from typing import Any


def _search_tavily(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    from tavily import TavilyClient

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError(
            "TAVILY_API_KEY is not set. Add it to apps/agent/.env or the environment."
        )

    client = TavilyClient(api_key=api_key)
    response = client.search(query=query, max_results=max_results, search_depth="basic")
    results: list[dict[str, Any]] = []
    for item in response.get("results", []):
        results.append(
            {
                "title": item.get("title") or "Untitled",
                "url": item.get("url") or "",
                "snippet": item.get("content") or item.get("snippet") or "",
                "query": query,
            }
        )
    return results


def _search_serpapi(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    from serpapi import GoogleSearch

    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "SERPAPI_API_KEY is not set. Add it to apps/agent/.env or the environment."
        )

    search = GoogleSearch({"q": query, "api_key": api_key, "num": max_results})
    data = search.get_dict()
    results: list[dict[str, Any]] = []
    for item in data.get("organic_results", [])[:max_results]:
        results.append(
            {
                "title": item.get("title") or "Untitled",
                "url": item.get("link") or "",
                "snippet": item.get("snippet") or "",
                "query": query,
            }
        )
    return results


def web_search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """
    Search the web for a query.

    Provider is controlled by SEARCH_PROVIDER (tavily | serpapi).
    Defaults to Tavily when available.
    """
    provider = os.getenv("SEARCH_PROVIDER", "tavily").strip().lower()

    if provider == "serpapi":
        return _search_serpapi(query, max_results=max_results)

    if provider == "tavily":
        return _search_tavily(query, max_results=max_results)

    # Auto-select based on which key is present
    if os.getenv("TAVILY_API_KEY"):
        return _search_tavily(query, max_results=max_results)
    if os.getenv("SERPAPI_API_KEY"):
        return _search_serpapi(query, max_results=max_results)

    raise RuntimeError(
        "No search provider configured. Set TAVILY_API_KEY (recommended) "
        "or SERPAPI_API_KEY, and optionally SEARCH_PROVIDER=tavily|serpapi."
    )
