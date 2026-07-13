# api

NestJS API for the research-agent monorepo.

## Endpoints

- `GET /health` — health check
- `POST /research` — start a research run (JSON body) and stream SSE
- `GET /research?goal=...` — same stream for native `EventSource` clients

### POST /research

Request:

```json
{ "goal": "Your research goal" }
```

Response: `text/event-stream` with events:

- `status` — agent lifecycle messages
- `node` — planner / researcher / summarizer / final_output updates
- `result` — structured final JSON report
- `error` — failure details
- `done` — stream finished

## Agent integration

The API spawns the Python agent via `child_process`:

```
apps/agent/.venv/bin/python -u apps/agent/stream_main.py --goal "..."
```

Optional env vars:

- `AGENT_ROOT` — absolute path to `apps/agent`
- `AGENT_PYTHON` — Python binary override
- `PORT` — API port (default `3001`)

## Run

```bash
cd apps/api
pnpm start:dev
```
