# Render — Python research agent (researchagentnew-3)

## Service settings

| Setting | Value |
|---|---|
| **Root Directory** | `apps/agent` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

## Required environment variables

Set these in the Render dashboard for this service:

| Variable | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | Yes (live mode) | OpenAI chat model for planner/summarizer/final |
| `TAVILY_API_KEY` | Yes* | Preferred web search |
| `SERPAPI_API_KEY` | Optional* | Fallback if Tavily not set |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` |
| `SEARCH_PROVIDER` | Optional | `tavily` (default) or `serpapi` |
| `AGENT_MOCK` | Optional | `1` = stub response without API keys |

\* At least one of `TAVILY_API_KEY` or `SERPAPI_API_KEY` is required when `AGENT_MOCK` is not enabled.

## Flow

`POST /research` with `{"goal":"..."}` runs:

planner → researcher (web search) → summarizer → final_output

NestJS and the Next.js frontend expect JSON:

```json
{
  "title": "...",
  "summary": "...",
  "key_findings": ["..."],
  "sources": [{"title":"...","url":"...","snippet":"..."}],
  "goal": "..."
}
```

## Verify

```bash
curl https://researchagentnew-3.onrender.com/health
curl -X POST https://researchagentnew-3.onrender.com/research \
  -H 'Content-Type: application/json' \
  -d '{"goal":"Best AI tools for marketing in 2026"}'
```

Live research can take 30–90 seconds. If Nest returns **502**, the Python process crashed or slept — check Render logs (OOM is common on free plans with heavy LangChain installs).
