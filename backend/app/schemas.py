from pydantic import BaseModel
from typing import List, Optional


class UploadedFileInfo(BaseModel):
    name: str
    size: int
    type: str


class TriageRequest(BaseModel):
    selected_region: Optional[str] = None
    selected_label: Optional[str] = None
    pain_level: int
    description: Optional[str] = ""
    uploaded_files: List[UploadedFileInfo] = []


class TriageResponse(BaseModel):
    risk_label: str
    visit_recommendation: str
    suggested_specialty: str
    doctor_summary: str
    safety_notice: str


class DoctorMatchRequest(BaseModel):
    suggested_specialty: Optional[str] = ""
    selected_region: Optional[str] = None
    selected_label: Optional[str] = None
    pain_level: int = 5


class DoctorResponse(BaseModel):
    id: int
    name: str
    specialty: str
    specialty_key: str
    distance: str
    distance_km: float
    available: str
    rating: float
    clinic: str
    address: str
    match_score: int
    is_recommended: bool


class DoctorMatchResponse(BaseModel):
    suggested_specialties: str
    selected_label: Optional[str] = None
    pain_level: int
    doctors: List[DoctorResponse]


class SelectedDoctorInfo(BaseModel):
    doctorId: int
    doctorName: str
    specialty: str
    clinic: str
    available: str
    distance: str
    rating: float
    matchScore: int
    selectedAt: Optional[str] = None


class BookingRequest(BaseModel):
    doctor: SelectedDoctorInfo
    triage_result: TriageResponse
    body_map: TriageRequest
    uploaded_files: List[UploadedFileInfo] = []


class BookingResponse(BaseModel):
    booking_id: str
    status: str
    message: str
    doctor_name: str
    appointment_time: str
    patient_summary: str