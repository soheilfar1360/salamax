import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from app.schemas import BookingRequest, BookingResponse


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
BOOKINGS_FILE = DATA_DIR / "bookings.json"


def ensure_bookings_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not BOOKINGS_FILE.exists():
        BOOKINGS_FILE.write_text("[]", encoding="utf-8")


def read_bookings() -> list[dict]:
    ensure_bookings_file()

    try:
        content = BOOKINGS_FILE.read_text(encoding="utf-8")
        return json.loads(content)
    except json.JSONDecodeError:
        return []


def write_bookings(bookings: list[dict]) -> None:
    ensure_bookings_file()
    BOOKINGS_FILE.write_text(
        json.dumps(bookings, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def create_booking(data: BookingRequest) -> BookingResponse:
    booking_id = f"SALAMAX-{str(uuid4())[:8].upper()}"
    confirmed_at = datetime.utcnow().isoformat() + "Z"

    patient_summary = (
        f"بیمار برای ناحیه {data.body_map.selected_label or 'نامشخص'} "
        f"با شدت درد {data.body_map.pain_level} از ۱۰ ثبت شده است. "
        f"درجه هشدار: {data.triage_result.risk_label}. "
        f"تخصص پیشنهادی: {data.triage_result.suggested_specialty}. "
        f"تعداد مدارک پزشکی: {len(data.uploaded_files)}."
    )

    booking_record = {
        "booking_id": booking_id,
        "status": "confirmed",
        "confirmed_at": confirmed_at,
        "doctor": data.doctor.model_dump(),
        "triage_result": data.triage_result.model_dump(),
        "body_map": data.body_map.model_dump(),
        "uploaded_files": [file.model_dump() for file in data.uploaded_files],
        "patient_summary": patient_summary,
    }

    bookings = read_bookings()
    bookings.append(booking_record)
    write_bookings(bookings)

    return BookingResponse(
        booking_id=booking_id,
        status="confirmed",
        message="رزرو آزمایشی با موفقیت در بک‌اند ذخیره شد.",
        doctor_name=data.doctor.doctorName,
        appointment_time=data.doctor.available,
        patient_summary=patient_summary,
    )


def list_bookings() -> list[dict]:
    return read_bookings()
