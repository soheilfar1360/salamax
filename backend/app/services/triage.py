from app.schemas import TriageRequest, TriageResponse


def get_risk_label(pain_level: int) -> str:
    if pain_level <= 3:
        return "سبز"
    if pain_level <= 6:
        return "زرد"
    if pain_level <= 8:
        return "نارنجی"
    return "قرمز"


def get_visit_recommendation(pain_level: int) -> str:
    if pain_level <= 3:
        return "مراجعه معمولی در صورت ادامه علائم"
    if pain_level <= 6:
        return "مراجعه طی ۲۴ تا ۴۸ ساعت"
    if pain_level <= 8:
        return "مراجعه در اولین فرصت، ترجیحاً امروز"
    return "بررسی فوری یا تماس با اورژانس در صورت وجود علائم خطر"


def get_specialty(selected_region: str | None) -> str:
    if selected_region == "chest":
        return "قلب و عروق / داخلی"
    if selected_region == "abdomen":
        return "داخلی / گوارش"
    if selected_region == "head":
        return "مغز و اعصاب / داخلی"
    if selected_region in ["neck", "upper-back", "lower-back"]:
        return "ارتوپدی / طب فیزیکی"
    if selected_region in [
        "left-shoulder",
        "right-shoulder",
        "left-arm",
        "right-arm",
        "left-hand",
        "right-hand",
        "left-thigh",
        "right-thigh",
        "left-knee",
        "right-knee",
        "left-leg",
        "right-leg",
        "left-foot",
        "right-foot",
    ]:
        return "ارتوپدی / طب فیزیکی"
    return "پزشک عمومی / داخلی"


def analyze_triage(data: TriageRequest) -> TriageResponse:
    risk_label = get_risk_label(data.pain_level)
    visit_recommendation = get_visit_recommendation(data.pain_level)
    suggested_specialty = get_specialty(data.selected_region)
    uploaded_count = len(data.uploaded_files)

    doctor_summary = (
        f"بیمار ناحیه {data.selected_label or 'نامشخص'} را به عنوان محل اصلی درد یا ناراحتی انتخاب کرده است. "
        f"شدت درد {data.pain_level} از ۱۰ ثبت شده است. "
        f"توضیح بیمار: {data.description or 'توضیحی ثبت نشده است'}. "
        f"تعداد مدارک پزشکی انتخاب‌شده: {uploaded_count}. "
        f"بر اساس منطق آزمایشی سامانه، درجه هشدار {risk_label} و تخصص پیشنهادی {suggested_specialty} است."
    )

    safety_notice = (
        "این خروجی صرفاً برای راهنمایی اولیه است و جایگزین تشخیص، معاینه یا نظر پزشک نیست. "
        "در صورت وجود علائم شدید مانند درد قفسه سینه، تنگی نفس، ضعف ناگهانی، بیهوشی یا خونریزی شدید، فوراً با اورژانس تماس بگیرید."
    )

    return TriageResponse(
        risk_label=risk_label,
        visit_recommendation=visit_recommendation,
        suggested_specialty=suggested_specialty,
        doctor_summary=doctor_summary,
        safety_notice=safety_notice,
    )