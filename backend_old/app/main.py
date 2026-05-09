from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import TriageRequest, TriageResponse
from app.services.triage import analyze_triage

app = FastAPI(
    title="SALAMAX Backend API",
    description="Sandbox backend for SALAMAX smart healthcare workflow",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "SALAMAX backend is running",
    }


@app.post("/triage", response_model=TriageResponse)
def triage(request: TriageRequest):
    return analyze_triage(request)