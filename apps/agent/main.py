from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI(title="Research Agent")

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/research")
async def research(goal: str):
    async def event_stream():
        yield "data: Starting research...\n\n"
        await asyncio.sleep(1)
        yield "data: Planning steps...\n\n"
        await asyncio.sleep(1)
        yield "data: Research complete.\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")
