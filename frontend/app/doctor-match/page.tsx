"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type BodyMapData = {
  viewMode: "front" | "back";
  selectedRegion: string | null;
  selectedLabel: string;
  painLevel: number;
  description: string;
  savedAt: string;
};

type VisitReasonData = {
  reason: string;
  chiefComplaint: string;
  requiresBodyMap: false;
  createdAt: string;
};

type IntakeData = {
  chiefComplaint: string;
  detectedFlow: "pain_flow" | "general_visit_flow" | "emergency_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
  createdAt: string;
};

type TriageResponse = {
  risk_label: string;
  visit_recommendation: string;
  suggested_specialty: string;
  doctor_summary: string;
  safety_notice: string;
};

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  specialty_key: string;
  distance: string;
  distance_km: number;
  available: string;
  rating: number;
  clinic: string;
  address: string;
  match_score: number;
  is_recommended: boolean;
};

type DoctorMatchResponse = {
  suggested_specialties: string;
  selected_label: string | null;
  pain_level: number;
  matching_basis: "محل درد" | "دلیل مراجعه" | "اطلاعات اولیه";
  doctors: Doctor[];
};

const doctors = [
  {
    id: 1,
    name: "دکتر نازنین احمدی",
    specialty: "متخصص داخلی",
    specialty_key: "internal",
    distance: "۲.۴ کیلومتر",
    distance_km: 2.4,
    available: "امروز، ساعت ۱۸:۳۰",
    rating: 4.8,
    clinic: "کلینیک سلامت نوین",
    address: "خیابان ولیعصر، بالاتر از پارک ملت",
  },
  {
    id: 2,
    name: "دکتر امیر رضایی",
    specialty: "متخصص عفونی",
    specialty_key: "infectious",
    distance: "۳.۱ کیلومتر",
    distance_km: 3.1,
    available: "فردا، ساعت ۱۰:۰۰",
    rating: 4.7,
    clinic: "درمانگاه سینا",
    address: "میدان ونک، خیابان گاندی",
  },
  {
    id: 3,
    name: "دکتر سارا کیانی",
    specialty: "پزشک عمومی",
    specialty_key: "general",
    distance: "۱.۲ کیلومتر",
    distance_km: 1.2,
    available: "امروز، ساعت ۲۰:۰۰",
    rating: 4.6,
    clinic: "مرکز درمانی مهر",
    address: "خیابان مطهری، نرسیده به سهروردی",
  },
  {
    id: 4,
    name: "دکتر پویا شریفی",
    specialty: "متخصص ارتوپدی",
    specialty_key: "orthopedic",
    distance: "۲.۸ کیلومتر",
    distance_km: 2.8,
    available: "فردا، ساعت ۱۶:۰۰",
    rating: 4.9,
    clinic: "کلینیک استخوان و مفصل آریا",
    address: "خیابان شریعتی، بالاتر از میرداماد",
  },
  {
    id: 5,
    name: "دکتر مریم پارسا",
    specialty: "متخصص قلب و عروق",
    specialty_key: "cardiology",
    distance: "۴.۲ کیلومتر",
    distance_km: 4.2,
    available: "امروز، ساعت ۱۹:۱۵",
    rating: 4.9,
    clinic: "کلینیک قلب آرام",
    address: "خیابان نلسون ماندلا، کوچه ناهید",
  },
  {
    id: 6,
    name: "دکتر آرش نادری",
    specialty: "متخصص مغز و اعصاب",
    specialty_key: "neurology",
    distance: "۵.۰ کیلومتر",
    distance_km: 5,
    available: "پس‌فردا، ساعت ۱۱:۳۰",
    rating: 4.7,
    clinic: "کلینیک نورون",
    address: "خیابان پاسداران، بوستان نهم",
  },
  {
    id: 7,
    name: "دکتر لیلا فرهمند",
    specialty: "متخصص گوارش",
    specialty_key: "gastro",
    distance: "۳.۶ کیلومتر",
    distance_km: 3.6,
    available: "فردا، ساعت ۱۲:۱۵",
    rating: 4.8,
    clinic: "کلینیک گوارش سپید",
    address: "خیابان مطهری، خیابان فجر",
  },
  {
    id: 8,
    name: "دکتر کامیار توکلی",
    specialty: "طب فیزیکی و توان‌بخشی",
    specialty_key: "physical",
    distance: "۲.۰ کیلومتر",
    distance_km: 2,
    available: "امروز، ساعت ۱۷:۴۵",
    rating: 4.6,
    clinic: "مرکز توان‌بخشی حرکت",
    address: "خیابان شریعتی، حوالی قلهک",
  },
];

function safeReadStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function getPreferredKeysFromSpecialty(specialty?: string) {
  const text = specialty ?? "";
  const keys: string[] = [];

  if (text.includes("قلب")) keys.push("cardiology");
  if (text.includes("داخلی")) keys.push("internal");
  if (text.includes("گوارش")) keys.push("gastro");
  if (text.includes("مغز") || text.includes("اعصاب")) keys.push("neurology");
  if (text.includes("ارتوپدی")) keys.push("orthopedic");
  if (text.includes("طب فیزیکی")) keys.push("physical");
  if (text.includes("عمومی")) keys.push("general");

  if (!keys.length) keys.push("general", "internal");
  if (!keys.includes("general")) keys.push("general");

  return keys;
}

function getPreferredKeysFromVisitReason(reason?: string) {
  switch (reason) {
    case "چکاپ عمومی":
      return ["general", "internal"];
    case "بررسی جواب آزمایش":
      return ["internal", "general"];
    case "تمدید نسخه":
      return ["general", "internal"];
    case "مشاوره تخصصی":
      return ["general", "internal"];
    case "پیگیری بیماری قبلی":
      return ["internal", "general"];
    case "مشاوره دارویی":
      return ["general", "internal"];
    default:
      return ["general"];
  }
}

function getSpecialtyTitle(keys: string[]) {
  const labels: Record<string, string> = {
    cardiology: "قلب و عروق",
    internal: "داخلی",
    general: "پزشک عمومی",
    infectious: "عفونی",
    orthopedic: "ارتوپدی",
    neurology: "مغز و اعصاب",
    gastro: "گوارش",
    physical: "طب فیزیکی",
  };

  return keys.map((key) => labels[key] ?? key).join(" / ");
}

function calculateScore(
  doctor: (typeof doctors)[number],
  preferredKeys: string[],
  painLevel: number
) {
  const specialtyScore = preferredKeys.includes(doctor.specialty_key) ? 54 : 10;
  const priorityScore =
    preferredKeys.indexOf(doctor.specialty_key) >= 0
      ? Math.max(0, 12 - preferredKeys.indexOf(doctor.specialty_key) * 4)
      : 0;
  const ratingScore = doctor.rating * 5;
  const distanceScore = Math.max(0, 18 - doctor.distance_km * 2);
  const urgentBonus =
    painLevel >= 8 && doctor.available.includes("امروز") ? 8 : 0;

  return Math.min(
    99,
    Math.round(
      specialtyScore + priorityScore + ratingScore + distanceScore + urgentBonus
    )
  );
}

function buildDoctorMatch(
  bodyMap: BodyMapData | null,
  visitReason: VisitReasonData | null,
  triageResult: TriageResponse | null
): DoctorMatchResponse {
  const matchingBasis = bodyMap
    ? "محل درد"
    : visitReason
    ? "دلیل مراجعه"
    : "اطلاعات اولیه";
  const preferredKeys = bodyMap
    ? getPreferredKeysFromSpecialty(triageResult?.suggested_specialty)
    : getPreferredKeysFromVisitReason(visitReason?.reason);
  const painLevel = bodyMap?.painLevel ?? 3;

  const ranked = doctors
    .map((doctor) => ({
      ...doctor,
      match_score: calculateScore(doctor, preferredKeys, painLevel),
      is_recommended: preferredKeys.includes(doctor.specialty_key),
    }))
    .sort((first, second) => second.match_score - first.match_score);

  return {
    suggested_specialties: getSpecialtyTitle(preferredKeys),
    selected_label: bodyMap?.selectedLabel ?? visitReason?.reason ?? null,
    pain_level: painLevel,
    matching_basis: matchingBasis,
    doctors: ranked,
  };
}

function getRiskBadgeClass(riskLabel?: string) {
  switch (riskLabel) {
    case "سبز":
      return "border-green-300 bg-green-50 text-green-800";
    case "زرد":
      return "border-yellow-300 bg-yellow-50 text-yellow-800";
    case "نارنجی":
      return "border-orange-300 bg-orange-50 text-orange-800";
    case "قرمز":
      return "border-red-300 bg-red-50 text-red-800";
    default:
      return "border-gray-300 bg-gray-50 text-gray-800";
  }
}

function getMatchingBasisText(basis: DoctorMatchResponse["matching_basis"]) {
  if (basis === "محل درد") return "بر اساس محل درد";
  if (basis === "دلیل مراجعه") return "بر اساس دلیل مراجعه";
  return "بر اساس اطلاعات اولیه";
}

export default function DoctorMatchPage() {
  const [intakeData] = useState<IntakeData | null>(() =>
    safeReadStorage<IntakeData>("salamax_intake")
  );
  const [bodyMapData] = useState<BodyMapData | null>(() =>
    safeReadStorage<BodyMapData>("salamax_body_map")
  );
  const [visitReasonData] = useState<VisitReasonData | null>(() =>
    safeReadStorage<VisitReasonData>("salamax_visit_reason")
  );
  const [triageResult] = useState<TriageResponse | null>(() =>
    safeReadStorage<TriageResponse>("salamax_triage_result")
  );

  const doctorMatch = useMemo(() => {
    const match = buildDoctorMatch(bodyMapData, visitReasonData, triageResult);

    if (typeof window !== "undefined") {
      localStorage.setItem("salamax_doctor_match", JSON.stringify(match));
    }

    return match;
  }, [bodyMapData, triageResult, visitReasonData]);

  function handleSelectDoctor(doctor: Doctor) {
    const bookingData = {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      clinic: doctor.clinic,
      available: doctor.available,
      distance: doctor.distance,
      rating: doctor.rating,
      matchScore: doctor.match_score,
      selectedAt: new Date().toISOString(),
    };

    localStorage.setItem("salamax_selected_doctor", JSON.stringify(bookingData));
  }

  const bestDoctor = doctorMatch.doctors[0];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">
                پزشکان پیشنهادی
              </h1>

              <p className="mt-3 max-w-3xl leading-8 text-gray-600">
                این پیشنهادها با منطق frontend sandbox و بر اساس{" "}
                <span className="font-bold">
                  {getMatchingBasisText(doctorMatch.matching_basis)}
                </span>{" "}
                رتبه‌بندی شده‌اند.
              </p>
            </div>

            <Link
              href="/results"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center text-gray-700 hover:bg-gray-50"
            >
              بازگشت به نتیجه تحلیل
            </Link>
          </div>

          {intakeData?.detectedFlow === "emergency_flow" && (
            <div className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950">
              <h2 className="font-bold">یادآوری علائم خطر</h2>
              <p className="mt-2 text-sm leading-7">
                اگر علائم شدید یا خطرناک دارید، منتظر ادامه فرآیند سامانه
                نمانید و فوراً با اورژانس تماس بگیرید.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900 md:col-span-2">
              <h2 className="font-bold">مبنای تطبیق</h2>

              <p className="mt-3 leading-7">
                {getMatchingBasisText(doctorMatch.matching_basis)}
              </p>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
              <h2 className="font-bold">
                {bodyMapData
                  ? "ناحیه ثبت‌شده"
                  : visitReasonData
                  ? "دلیل مراجعه"
                  : "اطلاعات اولیه"}
              </h2>

              <p className="mt-3 leading-7">
                {doctorMatch.selected_label ?? "اطلاعاتی ثبت نشده"}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-5 ${getRiskBadgeClass(
                triageResult?.risk_label
              )}`}
            >
              <h2 className="font-bold">درجه هشدار</h2>

              <p className="mt-3 leading-7">
                {triageResult?.risk_label ?? "نامشخص"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-slate-50 p-5">
            <h2 className="font-bold text-blue-900">خلاصه برای پزشک</h2>

            <p className="mt-3 leading-8 text-gray-700">
              {triageResult?.doctor_summary ??
                "خلاصه‌ای از تحلیل اولیه ثبت نشده است."}
            </p>
          </div>

          {bestDoctor && (
            <div className="mt-8 rounded-2xl border border-teal-300 bg-teal-50 p-6">
              <p className="text-sm font-bold text-teal-800">
                بهترین تطبیق پیشنهادی
              </p>

              <h2 className="mt-2 text-2xl font-bold text-blue-900">
                {bestDoctor.name}
              </h2>

              <p className="mt-2 text-teal-800">
                {bestDoctor.specialty} | امتیاز تطبیق:{" "}
                {bestDoctor.match_score}٪
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-5">
            {doctorMatch.doctors.map((doctor, index) => (
              <div
                key={doctor.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                  doctor.is_recommended
                    ? "border-teal-300"
                    : "border-gray-200"
                }`}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-blue-900">
                        {doctor.name}
                      </h2>

                      {index === 0 && (
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                          پیشنهاد اول
                        </span>
                      )}

                      {doctor.is_recommended && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                          مرتبط با تحلیل
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-teal-700">{doctor.specialty}</p>
                    <p className="mt-2 text-gray-600">{doctor.clinic}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {doctor.address}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700">
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        فاصله: {doctor.distance}
                      </span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        امتیاز پزشک: {doctor.rating}
                      </span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        اولین نوبت: {doctor.available}
                      </span>
                      <span className="rounded-full bg-teal-100 px-4 py-2 text-teal-900">
                        امتیاز تطبیق: {doctor.match_score}٪
                      </span>
                    </div>
                  </div>

                  <div className="flex min-w-[170px] flex-col gap-3">
                    <Link
                      href="/booking"
                      onClick={() => handleSelectDoctor(doctor)}
                      className="rounded-xl bg-blue-900 px-6 py-3 text-center text-white hover:bg-blue-800"
                    >
                      انتخاب و رزرو
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-sm leading-7 text-yellow-900">
            این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی
            اولیه و هدایت مسیر مراجعه طراحی شده است. رتبه‌بندی پزشکان در این
            نسخه sandbox بر اساس داده‌های نمونه انجام می‌شود.
          </div>
        </div>
      </div>
    </main>
  );
}
