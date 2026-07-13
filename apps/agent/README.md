# agent

LangGraph + LangChain research agent.

## Flow

```
planner → researcher → summarizer → final_output
```

Returns clean JSON with `title`, `key_findings`, `sources`, and `summary`.

## Setup

```bash
cd apps/agent

# Python 3.12 recommended (uv can install it)
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -e .

cp .env.example .env
```

Required env vars in `.env`:

- `OPENAI_API_KEY`
- `TAVILY_API_KEY` (recommended) **or** `SERPAPI_API_KEY`

Optional:

- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `SEARCH_PROVIDER` (`tavily` or `serpapi`)

## Run locally

```bash
source .venv/bin/activate
python main.py

# custom goal
python main.py "What are the latest advances in solid-state batteries?"
```

Or from the monorepo root (after setup):

```bash
pnpm --filter agent dev
```
