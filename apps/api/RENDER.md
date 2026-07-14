# Render deployment notes

## Open these URLs

- Frontend: https://researchagentnew-1.onrender.com
- Nest API health: https://researchagentnew-2.onrender.com/health
- Python agent health: https://researchagentnew-3.onrender.com/health

If Nest `/health` works but research returns **502**, the Python service is down.

## Fix Python 502 (researchagentnew-3)

Free Render instances often crash if `requirements.txt` pulls heavy packages
(LangChain/NumPy) that the current `main.py` does not need.

Use a light `requirements.txt` (already in this repo):

```
fastapi
uvicorn[standard]
pydantic
python-dotenv
```

| Setting | Value |
|---|---|
| **Root Directory** | `apps/agent` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

Then:

1. Trigger a **Manual Deploy** for `researchagentnew-3`
2. Wait until status is **Live**
3. Open https://researchagentnew-3.onrender.com/health  
   Expect: `{"status":"healthy"}`
4. Retry Start Research on the frontend

If health never loads, open Render → Python service → **Logs** and look for crash / OOM / port bind errors.

## NestJS service (researchagentnew-2)

| Setting | Value |
|---|---|
| **Root Directory** | *(empty / repo root)* |
| **Build Command** | `pnpm install && pnpm --filter api build` |
| **Start Command** | `pnpm --filter api start:prod` |

## Next.js frontend (researchagentnew-1)

| Setting | Value |
|---|---|
| **Root Directory** | *(empty / repo root)* |
| **Build Command** | `pnpm install && pnpm --filter web build` |
| **Start Command** | `pnpm --filter web start` |

## Quick verify

```bash
curl https://researchagentnew-3.onrender.com/health
curl -X POST https://researchagentnew-3.onrender.com/research \
  -H 'Content-Type: application/json' \
  -d '{"goal":"Best AI tools for marketing"}'

curl https://researchagentnew-2.onrender.com/health
curl -X POST https://researchagentnew-2.onrender.com/research \
  -H 'Content-Type: application/json' \
  -d '{"goal":"Best AI tools for marketing"}'
```
