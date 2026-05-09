"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type VisitMode = "online" | "in_person" | "any";
type Priority =
  | "distance"
  | "specialty"
  | "rating"
  | "availability"
  | "punctuality"
  | "balanced";

type Weights = {
  specialty: number;
  distance: number;
  rating: number;
  availability: number;
  punctuality: number;
  visitMode: number;
};

type VisitPreference = {
  visitMode: VisitMode;
  priority: Priority;
  weights: Weights;
  createdAt: string;
};

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
  visitModes: Array<"online" | "in_person">;
  punctualityScore: number;
  nextAvailableMinutes: number;
  consultationFee: number;
  match_score: number;
  is_recommended: boolean;
  whyRecommended: string;
};

type DoctorMatchResponse = {
  suggested_specialties: string;
  selected_label: string | null;
  pain_level: number;
  matching_basis: "محل درد" | "دلیل مراجعه" | "اطلاعات اولیه";
  visitPreference: VisitPreference;
  doctors: Doctor[];
};

const defaultPreference: VisitPreference = {
  visitMode: "any",
  priority: "balanced",
  weights: {
    specialty: 0.25,
    distance: 0.15,
    rating: 0.2,
    availability: 0.15,
    punctuality: 0.15,
    visitMode: 0.1,
  },
  createdAt: "",
};

const doctors: Omit<
  Doctor,
  "match_score" | "is_recommended" | "whyRecommended"
>[] = [
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
    visitModes: ["online", "in_person"],
    punctualityScore: 88,
    nextAvailableMinutes: 180,
    consultationFee: 420000,
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
    visitModes: ["online"],
    punctualityScore: 91,
    nextAvailableMinutes: 960,
    consultationFee: 390000,
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
    visitModes: ["online", "in_person"],
    punctualityScore: 84,
    nextAvailableMinutes: 270,
    consultationFee: 280000,
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
    visitModes: ["in_person"],
    punctualityScore: 86,
    nextAvailableMinutes: 1320,
    consultationFee: 520000,
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
    visitModes: ["online", "in_person"],
    punctualityScore: 93,
    nextAvailableMinutes: 225,
    consultationFee: 560000,
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
    visitModes: ["online", "in_person"],
    punctualityScore: 89,
    nextAvailableMinutes: 2340,
    consultationFee: 540000,
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
    visitModes: ["in_person"],
    punctualityScore: 82,
    nextAvailableMinutes: 1095,
    consultationFee: 470000,
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
    visitModes: ["online", "in_person"],
    punctualityScore: 87,
    nextAvailableMinutes: 135,
    consultationFee: 360000,
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
    case "مشاوره تخصصی":
    case "مشاوره دارویی":
      return ["general", "internal"];
    case "پیگیری بیماری قبلی":
      return ["internal", "general"];
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

function getPreference() {
  return (
    safeReadStorage<VisitPreference>("salamax_visit_preference") ??
    defaultPreference
  );
}

function getDistanceScore(distanceKm: number, visitMode: VisitMode) {
  if (visitMode === "online") return 100;

  const maxDistanceKm = Math.max(...doctors.map((doctor) => doctor.distance_km));
  return Math.round(Math.max(0, 100 - (distanceKm / maxDistanceKm) * 100));
}

function getAvailabilityScore(nextAvailableMinutes: number) {
  const maxMinutes = Math.max(
    ...doctors.map((doctor) => doctor.nextAvailableMinutes)
  );
  return Math.round(Math.max(0, 100 - (nextAvailableMinutes / maxMinutes) * 100));
}

function getSpecialtyScore(specialtyKey: string, preferredKeys: string[]) {
  const index = preferredKeys.indexOf(specialtyKey);
  if (index === 0) return 100;
  if (index > 0) return 82;
  if (specialtyKey === "general") return 70;
  return 35;
}

function getVisitModeScore(doctor: (typeof doctors)[number], visitMode: VisitMode) {
  if (visitMode === "any") return 100;
  return doctor.visitModes.includes(visitMode) ? 100 : 0;
}

function getWhyRecommended(
  doctor: Doctor,
  preferredKeys: string[],
  preference: VisitPreference
) {
  const reasons: string[] = [];

  if (preferredKeys.includes(doctor.specialty_key)) {
    reasons.push("تخصص پزشک با مسیر مراجعه مرتبط است");
  }

  if (preference.visitMode === "online" && doctor.visitModes.includes("online")) {
    reasons.push("امکان ویزیت آنلاین دارد");
  }

  if (
    preference.visitMode === "in_person" &&
    doctor.visitModes.includes("in_person")
  ) {
    reasons.push("برای ویزیت حضوری قابل انتخاب است");
  }

  if (preference.priority === "distance") {
    reasons.push(`فاصله ثبت‌شده ${doctor.distance} است`);
  }

  if (preference.priority === "availability") {
    reasons.push(`اولین نوبت: ${doctor.available}`);
  }

  if (preference.priority === "punctuality") {
    reasons.push(`امتیاز خوش‌قولی ${doctor.punctualityScore} از ۱۰۰ است`);
  }

  if (preference.priority === "rating") {
    reasons.push(`امتیاز کاربران ${doctor.rating} از ۵ است`);
  }

  return reasons.length
    ? reasons.join("، ")
    : "بر اساس ترکیب تخصص، دسترسی، امتیاز و اولویت‌های شما پیشنهاد شده است";
}

function calculateScore(
  doctor: (typeof doctors)[number],
  preferredKeys: string[],
  preference: VisitPreference
) {
  const specialtyScore = getSpecialtyScore(doctor.specialty_key, preferredKeys);
  const distanceScore = getDistanceScore(doctor.distance_km, preference.visitMode);
  const ratingScore = Math.round((doctor.rating / 5) * 100);
  const availabilityScore = getAvailabilityScore(doctor.nextAvailableMinutes);
  const visitModeScore = getVisitModeScore(doctor, preference.visitMode);
  const weights = preference.weights;

  const finalScore =
    specialtyScore * weights.specialty +
    distanceScore * weights.distance +
    ratingScore * weights.rating +
    availabilityScore * weights.availability +
    doctor.punctualityScore * weights.punctuality +
    visitModeScore * weights.visitMode;

  return Math.round(finalScore);
}

function buildDoctorMatch(
  bodyMap: BodyMapData | null,
  visitReason: VisitReasonData | null,
  triageResult: TriageResponse | null,
  preference: VisitPreference
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
    .map((doctor) => {
      const score = calculateScore(doctor, preferredKeys, preference);
      const isRecommended = preferredKeys.includes(doctor.specialty_key);
      const enrichedDoctor = {
        ...doctor,
        match_score: score,
        is_recommended: isRecommended,
        whyRecommended: "",
      };

      return {
        ...enrichedDoctor,
        whyRecommended: getWhyRecommended(
          enrichedDoctor,
          preferredKeys,
          preference
        ),
      };
    })
    .sort((first, second) => second.match_score - first.match_score);

  return {
    suggested_specialties: getSpecialtyTitle(preferredKeys),
    selected_label: bodyMap?.selectedLabel ?? visitReason?.reason ?? null,
    pain_level: painLevel,
    matching_basis: matchingBasis,
    visitPreference: preference,
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

function getVisitModeLabel(visitMode: VisitMode) {
  if (visitMode === "online") return "ویزیت آنلاین";
  if (visitMode === "in_person") return "ویزیت حضوری";
  return "فرقی ندارد";
}

function getPriorityLabel(priority: Priority) {
  const labels: Record<Priority, string> = {
    distance: "نزدیک‌ترین پزشک",
    specialty: "تخصص مرتبط‌تر",
    rating: "بالاترین امتیاز",
    availability: "زودترین نوبت",
    punctuality: "کمترین احتمال تأخیر",
    balanced: "تعادل همه موارد",
  };

  return labels[priority];
}

function getVisitModesLabel(visitModes: Doctor["visitModes"]) {
  if (visitModes.includes("online") && visitModes.includes("in_person")) {
    return "آنلاین / حضوری";
  }

  if (visitModes.includes("online")) return "آنلاین";
  return "حضوری";
}

function formatFee(fee: number) {
  return `${fee.toLocaleString("fa-IR")} تومان`;
}

export default function DoctorMatchPage() {
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [bodyMapData, setBodyMapData] = useState<BodyMapData | null>(null);
  const [visitReasonData, setVisitReasonData] =
    useState<VisitReasonData | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResponse | null>(null);
  const [visitPreference, setVisitPreference] =
    useState<VisitPreference>(defaultPreference);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setIntakeData(safeReadStorage<IntakeData>("salamax_intake"));
      setBodyMapData(safeReadStorage<BodyMapData>("salamax_body_map"));
      setVisitReasonData(
        safeReadStorage<VisitReasonData>("salamax_visit_reason")
      );
      setTriageResult(safeReadStorage<TriageResponse>("salamax_triage_result"));
      setVisitPreference(getPreference());
    });
  }, []);

  const doctorMatch = useMemo(() => {
    return buildDoctorMatch(
      bodyMapData,
      visitReasonData,
      triageResult,
      visitPreference
    );
  }, [bodyMapData, triageResult, visitReasonData, visitPreference]);

  useEffect(() => {
    localStorage.setItem("salamax_doctor_match", JSON.stringify(doctorMatch));
  }, [doctorMatch]);

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
      visitModes: doctor.visitModes,
      punctualityScore: doctor.punctualityScore,
      nextAvailableMinutes: doctor.nextAvailableMinutes,
      consultationFee: doctor.consultationFee,
      whyRecommended: doctor.whyRecommended,
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
                این پیشنهادها بر اساس{" "}
                <span className="font-bold">
                  {getMatchingBasisText(doctorMatch.matching_basis)}
                </span>{" "}
                و اولویت‌های انتخاب پزشک شما رتبه‌بندی شده‌اند.
              </p>
            </div>

            <Link
              href="/visit-preference"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center text-gray-700 hover:bg-gray-50"
            >
              اصلاح اولویت‌ها
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

          <div className="mt-8 grid gap-5 md:grid-cols-5">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900 md:col-span-2">
              <h2 className="font-bold">مبنای تطبیق</h2>
              <p className="mt-3 leading-7">
                {getMatchingBasisText(doctorMatch.matching_basis)}
              </p>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
              <h2 className="font-bold">نوع ویزیت</h2>
              <p className="mt-3 leading-7">
                {getVisitModeLabel(visitPreference.visitMode)}
              </p>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
              <h2 className="font-bold">اولویت بیمار</h2>
              <p className="mt-3 leading-7">
                {getPriorityLabel(visitPreference.priority)}
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
                {bestDoctor.specialty} | امتیاز تطبیق: {bestDoctor.match_score}٪
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

                    <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3">
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        نوع ویزیت: {getVisitModesLabel(doctor.visitModes)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        فاصله: {doctor.distance}
                      </span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        امتیاز پزشک: {doctor.rating}
                      </span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        خوش‌قولی: {doctor.punctualityScore}٪
                      </span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        اولین نوبت: {doctor.available}
                      </span>
                      <span className="rounded-full bg-teal-100 px-4 py-2 text-teal-900">
                        امتیاز تطبیق: {doctor.match_score}٪
                      </span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">
                        تعرفه نمونه: {formatFee(doctor.consultationFee)}
                      </span>
                    </div>

                    <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-7 text-blue-900">
                      <span className="font-bold">دلیل پیشنهاد:</span>{" "}
                      {doctor.whyRecommended}
                    </p>
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
            نسخه sandbox بر اساس داده‌های نمونه و اولویت‌های انتخاب‌شده انجام
            می‌شود.
          </div>
        </div>
      </div>
    </main>
  );
}
