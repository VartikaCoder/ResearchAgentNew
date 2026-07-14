from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Research Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    goal: str


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/research")
async def research(body: ResearchRequest):
    goal = body.goal.strip()
    if not goal:
        return {"error": "Goal is required"}

    # Simple structured response for Nest/frontend.
    # Replace with real LangGraph invoke when ready.
    return {
        "title": f"Research brief: {goal}",
        "summary": f"Preliminary research completed for: {goal}",
        "key_findings": [
            f"Understood the research goal: {goal}",
            "Gathered context from the agent service",
            "Prepared a structured report for the Nest API",
        ],
        "sources": [
            {
                "title": "Research Agent",
                "url": "https://researchagentnew-3.onrender.com",
                "snippet": "Python FastAPI + LangGraph research endpoint",
            }
        ],
        "goal": goal,
    }
