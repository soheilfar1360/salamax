from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    TriageRequest,
    TriageResponse,
    DoctorMatchRequest,
    DoctorMatchResponse,
    BookingRequest,
    BookingResponse,
)

from app.services.triage import analyze_triage
from app.services.doctor_match import match_doctors
from app.services.booking import create_booking, list_bookings


app = FastAPI(
    title="SALAMAX Backend API",
    description="Sandbox backend for SALAMAX smart healthcare workflow",
    version="0.4.0",
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
        "version": "0.4.0",
    }


@app.post("/triage", response_model=TriageResponse)
def triage(request: TriageRequest):
    return analyze_triage(request)


@app.post("/doctor-match", response_model=DoctorMatchResponse)
def doctor_match(request: DoctorMatchRequest):
    return match_doctors(request)


@app.post("/booking", response_model=BookingResponse)
def booking(request: BookingRequest):
    return create_booking(request)


@app.get("/bookings")
def bookings():
    saved_bookings = list_bookings()

    return {
        "count": len(saved_bookings),
        "items": saved_bookings,
    }