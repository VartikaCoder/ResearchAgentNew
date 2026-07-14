# Render deployment notes

## Open these URLs

- Frontend: https://researchagentnew-1.onrender.com
- Nest API health: https://researchagentnew-2.onrender.com/health
- Python agent health: https://researchagentnew-3.onrender.com/health

## NestJS service (researchagentnew-2)

In the Render dashboard for this service, set:

| Setting | Value |
|---|---|
| **Root Directory** | leave empty (repo root) **or** `apps/api` |
| **Build Command** (repo root) | `pnpm install && pnpm --filter api build` |
| **Start Command** (repo root) | `pnpm --filter api start:prod` |
| **Build Command** (if root = `apps/api`) | `cd ../.. && pnpm install && pnpm --filter api build` |
| **Start Command** (if root = `apps/api`) | `node dist/main` |

Do **not** use root `pnpm start:prod` — the root `package.json` has no such script, so the Nest routes never come up and you get 404s.

## Python agent (researchagentnew-3)

| Setting | Value |
|---|---|
| **Root Directory** | `apps/agent` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

## Next.js frontend (researchagentnew-1)

| Setting | Value |
|---|---|
| **Root Directory** | leave empty **or** `apps/web` |
| **Build Command** (repo root) | `pnpm install && pnpm --filter web build` |
| **Start Command** (repo root) | `pnpm --filter web start` |

## Quick verify after deploy

```bash
curl https://researchagentnew-2.onrender.com/health
curl -X POST https://researchagentnew-2.onrender.com/research \
  -H 'Content-Type: application/json' \
  -d '{"goal":"Best AI tools for marketing"}'
```

If `/health` is not `{"status":"ok",...}`, fix the Nest Render start command first.
