from app.schemas import DoctorMatchRequest, DoctorMatchResponse, DoctorResponse


DOCTORS = [
    {
        "id": 1,
        "name": "دکتر نازنین احمدی",
        "specialty": "متخصص داخلی",
        "specialty_key": "internal",
        "distance": "۲.۴ کیلومتر",
        "distance_km": 2.4,
        "available": "امروز، ساعت ۱۸:۳۰",
        "rating": 4.8,
        "clinic": "کلینیک سلامت نوین",
        "address": "خیابان ولیعصر، بالاتر از پارک ملت",
    },
    {
        "id": 2,
        "name": "دکتر امیر رضایی",
        "specialty": "متخصص عفونی",
        "specialty_key": "infectious",
        "distance": "۳.۱ کیلومتر",
        "distance_km": 3.1,
        "available": "فردا، ساعت ۱۰:۰۰",
        "rating": 4.7,
        "clinic": "درمانگاه سینا",
        "address": "میدان ونک، خیابان گاندی",
    },
    {
        "id": 3,
        "name": "دکتر سارا کیانی",
        "specialty": "پزشک عمومی",
        "specialty_key": "general",
        "distance": "۱.۲ کیلومتر",
        "distance_km": 1.2,
        "available": "امروز، ساعت ۲۰:۰۰",
        "rating": 4.6,
        "clinic": "مرکز درمانی مهر",
        "address": "خیابان مطهری، نرسیده به سهروردی",
    },
    {
        "id": 4,
        "name": "دکتر پویا شریفی",
        "specialty": "متخصص ارتوپدی",
        "specialty_key": "orthopedic",
        "distance": "۲.۸ کیلومتر",
        "distance_km": 2.8,
        "available": "فردا، ساعت ۱۶:۰۰",
        "rating": 4.9,
        "clinic": "کلینیک استخوان و مفصل آریا",
        "address": "خیابان شریعتی، بالاتر از میرداماد",
    },
    {
        "id": 5,
        "name": "دکتر مریم پارسا",
        "specialty": "متخصص قلب و عروق",
        "specialty_key": "cardiology",
        "distance": "۴.۲ کیلومتر",
        "distance_km": 4.2,
        "available": "امروز، ساعت ۱۹:۱۵",
        "rating": 4.9,
        "clinic": "کلینیک قلب آرام",
        "address": "خیابان نلسون ماندلا، کوچه ناهید",
    },
    {
        "id": 6,
        "name": "دکتر آرش نادری",
        "specialty": "متخصص مغز و اعصاب",
        "specialty_key": "neurology",
        "distance": "۵.۰ کیلومتر",
        "distance_km": 5.0,
        "available": "پس‌فردا، ساعت ۱۱:۳۰",
        "rating": 4.7,
        "clinic": "کلینیک نورون",
        "address": "خیابان پاسداران، بوستان نهم",
    },
    {
        "id": 7,
        "name": "دکتر لیلا فرهمند",
        "specialty": "متخصص گوارش",
        "specialty_key": "gastro",
        "distance": "۳.۶ کیلومتر",
        "distance_km": 3.6,
        "available": "فردا، ساعت ۱۲:۱۵",
        "rating": 4.8,
        "clinic": "کلینیک گوارش سپید",
        "address": "خیابان مطهری، خیابان فجر",
    },
    {
        "id": 8,
        "name": "دکتر کامیار توکلی",
        "specialty": "طب فیزیکی و توان‌بخشی",
        "specialty_key": "physical",
        "distance": "۲.۰ کیلومتر",
        "distance_km": 2.0,
        "available": "امروز، ساعت ۱۷:۴۵",
        "rating": 4.6,
        "clinic": "مرکز توان‌بخشی حرکت",
        "address": "خیابان شریعتی، حوالی قلهک",
    },
]


def get_preferred_keys(suggested_specialty: str | None) -> list[str]:
    text = suggested_specialty or ""
    keys: list[str] = []

    if "قلب" in text:
        keys.append("cardiology")
    if "داخلی" in text:
        keys.append("internal")
    if "گوارش" in text:
        keys.append("gastro")
    if "مغز" in text or "اعصاب" in text:
        keys.append("neurology")
    if "ارتوپدی" in text:
        keys.append("orthopedic")
    if "طب فیزیکی" in text:
        keys.append("physical")
    if "عفونی" in text:
        keys.append("infectious")
    if "عمومی" in text:
        keys.append("general")

    if not keys:
        keys = ["general", "internal"]

    if "general" not in keys:
        keys.append("general")

    return keys


def get_specialty_title(keys: list[str]) -> str:
    labels = {
        "cardiology": "قلب و عروق",
        "internal": "داخلی",
        "general": "پزشک عمومی",
        "infectious": "عفونی",
        "orthopedic": "ارتوپدی",
        "neurology": "مغز و اعصاب",
        "gastro": "گوارش",
        "physical": "طب فیزیکی",
    }

    return " / ".join([labels.get(key, key) for key in keys])


def calculate_score(doctor: dict, preferred_keys: list[str], pain_level: int) -> int:
    specialty_score = 60 if doctor["specialty_key"] in preferred_keys else 8
    rating_score = doctor["rating"] * 6
    distance_score = max(0, 20 - doctor["distance_km"] * 2)
    urgent_bonus = 8 if pain_level >= 8 and "امروز" in doctor["available"] else 0

    return min(99, round(specialty_score + rating_score + distance_score + urgent_bonus))


def match_doctors(data: DoctorMatchRequest) -> DoctorMatchResponse:
    preferred_keys = get_preferred_keys(data.suggested_specialty)

    ranked = []

    for doctor in DOCTORS:
      score = calculate_score(doctor, preferred_keys, data.pain_level)

      ranked.append(
          DoctorResponse(
              id=doctor["id"],
              name=doctor["name"],
              specialty=doctor["specialty"],
              specialty_key=doctor["specialty_key"],
              distance=doctor["distance"],
              distance_km=doctor["distance_km"],
              available=doctor["available"],
              rating=doctor["rating"],
              clinic=doctor["clinic"],
              address=doctor["address"],
              match_score=score,
              is_recommended=doctor["specialty_key"] in preferred_keys,
          )
      )

    ranked.sort(key=lambda item: item.match_score, reverse=True)

    return DoctorMatchResponse(
        suggested_specialties=get_specialty_title(preferred_keys),
        selected_label=data.selected_label,
        pain_level=data.pain_level,
        doctors=ranked,
    )