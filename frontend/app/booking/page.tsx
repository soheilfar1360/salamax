"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FlowStepper from "@/components/FlowStepper";

type BodyMapData = {
  viewMode: "front" | "back";
  selectedRegion: string | null;
  selectedLabel: string;
  painLevel: number;
  description: string;
  savedAt: string;
};

type UploadedFileInfo = {
  name: string;
  size: number;
  type: string;
};

type SelectedDoctor = {
  doctorId: number;
  doctorName: string;
  specialty: string;
  clinic: string;
  available: string;
  distance: string;
  rating: number;
  matchScore: number;
  visitModes?: Array<"online" | "in_person">;
  punctualityScore?: number;
  nextAvailableMinutes?: number;
  consultationFee?: number;
  whyRecommended?: string;
  selectedAt: string;
};

type VisitMode = "online" | "in_person" | "any";
type Priority =
  | "distance"
  | "specialty"
  | "rating"
  | "availability"
  | "punctuality"
  | "balanced";

type VisitPreference = {
  visitMode: VisitMode;
  priority: Priority;
  weights: {
    specialty: number;
    distance: number;
    rating: number;
    availability: number;
    punctuality: number;
    visitMode: number;
  };
  createdAt: string;
};

type TriageResponse = {
  risk_label: string;
  profileType?: "human" | "pet";
  detectedFlow?: IntakeData["detectedFlow"];
  visit_recommendation: string;
  suggested_specialty: string;
  doctor_summary: string;
  safety_notice: string;
};

type IntakeData = {
  chiefComplaint: string;
  detectedFlow:
    | "pain_flow"
    | "general_visit_flow"
    | "emergency_flow"
    | "veterinary_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
  profileType?: "human" | "pet";
  suggestedSpecialty?: string;
  relation?: string;
  petType?: string;
  breed?: string;
  vaccinationStatus?: string;
  petNotes?: string;
  doctorSummary?: string;
  createdAt: string;
};

type VisitReasonData = {
  reason: string;
  chiefComplaint: string;
  requiresBodyMap: false;
  createdAt: string;
};

type BookingConfirmation = {
  booking_id: string;
  status: string;
  message: string;
  doctor_name: string;
  appointment_time: string;
  patient_summary: string;
  confirmedAt: string;
  doctor: SelectedDoctor;
  intake: IntakeData | null;
  bodyMap: BodyMapData | null;
  visitReason: VisitReasonData | null;
  visitPreference?: VisitPreference | null;
  uploadedFiles: UploadedFileInfo[];
  triageResult: TriageResponse | null;
};

function safeReadStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function createBookingId() {
  const random = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `SALAMAX-${random}`;
}

function getFlowLabel(flow?: IntakeData["detectedFlow"]) {
  if (flow === "pain_flow") return "درد یا ناراحتی موضعی";
  if (flow === "emergency_flow") return "علائم هشدار";
  if (flow === "veterinary_flow") return "مسیر دامپزشکی";
  return "مراجعه عمومی";
}

function getVisitModeLabel(visitMode?: VisitMode) {
  if (visitMode === "online") return "آنلاین";
  if (visitMode === "in_person") return "حضوری";
  return "فرقی ندارد";
}

function getPriorityLabel(priority?: Priority) {
  const labels: Record<Priority, string> = {
    distance: "نزدیک‌ترین پزشک",
    specialty: "تخصص مرتبط‌تر",
    rating: "بالاترین امتیاز",
    availability: "زودترین نوبت",
    punctuality: "کمترین احتمال تأخیر",
    balanced: "تعادل همه موارد",
  };

  return priority ? labels[priority] : "تعادل همه موارد";
}

function hasVeterinarySignal(value?: string | null) {
  const text = value?.trim() ?? "";
  return (
    text.includes("دامپزشک") ||
    text.includes("دامپزشکی") ||
    text.includes("حیوان خانگی")
  );
}

function isPetCase(
  intake: IntakeData | null,
  triageResult: TriageResponse | null
) {
  const petRelations = ["سگ", "گربه", "پرنده", "خرگوش", "حیوان خانگی"];
  const relation = intake?.relation?.trim() ?? "";

  return Boolean(
    intake?.profileType === "pet" ||
      intake?.detectedFlow === "veterinary_flow" ||
      triageResult?.profileType === "pet" ||
      triageResult?.detectedFlow === "veterinary_flow" ||
      hasVeterinarySignal(intake?.suggestedSpecialty) ||
      hasVeterinarySignal(triageResult?.suggested_specialty) ||
      hasVeterinarySignal(intake?.doctorSummary) ||
      hasVeterinarySignal(triageResult?.doctor_summary) ||
      petRelations.includes(relation) ||
      intake?.petType?.trim() ||
      intake?.breed?.trim() ||
      intake?.vaccinationStatus?.trim() ||
      intake?.petNotes?.trim()
  );
}

export default function BookingPage() {
  const [intakeData] = useState<IntakeData | null>(() =>
    safeReadStorage<IntakeData>("salamax_intake")
  );
  const [bodyMapData] = useState<BodyMapData | null>(() =>
    safeReadStorage<BodyMapData>("salamax_body_map")
  );
  const [visitReasonData] = useState<VisitReasonData | null>(() =>
    safeReadStorage<VisitReasonData>("salamax_visit_reason")
  );
  const [uploadedFiles] = useState<UploadedFileInfo[]>(() =>
    safeReadStorage<UploadedFileInfo[]>("salamax_uploaded_files") ?? []
  );
  const [selectedDoctor] = useState<SelectedDoctor | null>(() =>
    safeReadStorage<SelectedDoctor>("salamax_selected_doctor")
  );
  const [triageResult] = useState<TriageResponse | null>(() =>
    safeReadStorage<TriageResponse>("salamax_triage_result")
  );
  const [visitPreference] = useState<VisitPreference | null>(() =>
    safeReadStorage<VisitPreference>("salamax_visit_preference")
  );
  const [bookingResponse, setBookingResponse] =
    useState<BookingConfirmation | null>(() =>
      safeReadStorage<BookingConfirmation>("salamax_booking_confirmation")
    );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [fallbackTrackingCode, setFallbackTrackingCode] = useState("");
  const [isFromApp] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("salamax_from_app") === "true"
  );
  const petCase = isPetCase(intakeData, triageResult);
  const selectedDoctorForDisplay =
    petCase && selectedDoctor?.specialty !== "دامپزشک" ? null : selectedDoctor;
  const suggestedSpecialtyForDisplay = petCase
    ? "دامپزشک"
    : triageResult?.suggested_specialty;
  const trackingCode = bookingResponse?.booking_id ?? fallbackTrackingCode;
  const [referralId] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("referralId") || "";
  });
  const [fromAppParam] = useState(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return (
      sp.get("fromApp") === "1" ||
      sp.get("source") === "app" ||
      sp.get("returnToApp") === "true"
    );
  });
  const [returnUrlParam] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("returnUrl") || "";
  });
  const isAppOrigin = isFromApp || fromAppParam || Boolean(referralId);

  useEffect(() => {
    if (!fallbackTrackingCode) {
      setFallbackTrackingCode(`SAL-${Date.now().toString().slice(-6)}`);
    }
  }, [fallbackTrackingCode]);

  function handleConfirmBooking() {
    setErrorMessage("");

    if (!selectedDoctorForDisplay || !triageResult || !intakeData) {
      setErrorMessage(
        "اطلاعات لازم برای ثبت رزرو کامل نیست. لطفاً مسیر پیش‌ویزیت، نتیجه تحلیل و انتخاب پزشک را کامل طی کنید."
      );
      return;
    }

    setIsSubmitting(true);

    const patientSummary =
      petCase
        ? `شرح اولیه: ${intakeData.chiefComplaint}. مسیر دامپزشکی. تخصص پیشنهادی: دامپزشک.`
        : bodyMapData !== null
        ? `شرح اولیه: ${intakeData.chiefComplaint}. محل درد: ${bodyMapData.selectedLabel}. شدت درد: ${bodyMapData.painLevel} از ۱۰. درجه هشدار: ${triageResult.risk_label}. تخصص پیشنهادی: ${triageResult.suggested_specialty}.`
        : `شرح اولیه: ${intakeData.chiefComplaint}. دلیل مراجعه: ${
            visitReasonData?.reason || "ثبت نشده"
          }. درجه هشدار: ${triageResult.risk_label}. تخصص پیشنهادی: ${
            suggestedSpecialtyForDisplay
          }.`;

    const confirmation: BookingConfirmation = {
      booking_id: createBookingId(),
      status: "confirmed",
      message: "رزرو آزمایشی با موفقیت در مرورگر ثبت شد.",
      doctor_name: selectedDoctorForDisplay.doctorName,
      appointment_time: selectedDoctorForDisplay.available,
      patient_summary: patientSummary,
      confirmedAt: new Date().toISOString(),
      doctor: selectedDoctorForDisplay,
      intake: intakeData,
      bodyMap: bodyMapData,
      visitReason: visitReasonData,
      visitPreference,
      uploadedFiles,
      triageResult,
    };

    localStorage.setItem(
      "salamax_booking_confirmation",
      JSON.stringify(confirmation)
    );
    setBookingResponse(confirmation);
    setShowBookingModal(true);
    setIsSubmitting(false);
  }

  async function handleCopyTrackingCode() {
    await navigator.clipboard?.writeText(trackingCode);
    setCopyMessage("کد پیگیری کپی شد");
  }

  function handleReturnToApp() {
    const urlFromParam = returnUrlParam.trim();
    const fallbackDeepLink = `salamax://booking-confirmation?code=${encodeURIComponent(
      trackingCode
    )}${referralId ? `&referralId=${encodeURIComponent(referralId)}` : ""}&status=confirmed`;
    const target = urlFromParam || fallbackDeepLink;

    window.location.href = target;
    window.setTimeout(() => {
      alert("برای بازگشت، اپلیکیشن سلامکس را باز کنید.");
    }, 700);
  }

  return (
    <main className="min-h-screen bg-[#F6FBFC] px-4 py-8 text-[#183B56] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <FlowStepper currentStep="booking" />
        {isAppOrigin && (
          <span className="salamax-app-badge mb-4 rounded-full px-4 py-2 text-sm font-bold">
            ادامه از اپلیکیشن سلامکس
          </span>
        )}
      <div className="rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(95,221,218,0.18)] bg-[rgba(39,214,208,0.08)] px-4 py-2 text-sm font-bold text-[#27D6D0]">
          تأیید نوبت Sandbox
        </span>
        <h1 className="mt-4 text-3xl font-bold text-blue-950">
          تأیید رزرو نوبت
        </h1>

        <p className="mt-3 leading-8 text-[#64748B]">
          در این مرحله، اطلاعات مسیر پیش‌ویزیت، پزشک انتخاب‌شده و خلاصه تحلیل
          برای ثبت رزرو آزمایشی در مرورگر آماده می‌شود.
          این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی اولیه
          و هدایت مسیر مراجعه طراحی شده است.
        </p>

        {bookingResponse && (
          <div className="mt-8 rounded-3xl border border-green-300 bg-gradient-to-br from-green-50 to-white p-6 text-green-900 shadow-lg shadow-green-100/70">
            <h2 className="text-xl font-bold">رزرو آزمایشی ثبت شد</h2>

            <div className="mt-4 space-y-3 leading-7">
              <p>
                <span className="font-bold">کد رزرو:</span>{" "}
                {bookingResponse.booking_id}
              </p>
              <p>
                <span className="font-bold">پیام:</span>{" "}
                {bookingResponse.message}
              </p>
              <p>
                <span className="font-bold">پزشک:</span>{" "}
                {bookingResponse.doctor_name}
              </p>
              <p>
                <span className="font-bold">زمان نوبت:</span>{" "}
                {bookingResponse.appointment_time}
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900">
            <h2 className="text-xl font-bold">خطا در ثبت رزرو</h2>
            <p className="mt-3 leading-7">{errorMessage}</p>
          </div>
        )}

        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm">
              <h2 className="text-xl font-bold text-[#102A43]">رزرو شما ثبت شد</h2>
              <p className="mt-4 salamax-muted">کد پیگیری شما:</p>
              <div className="mt-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-center text-2xl font-bold tracking-widest text-[#102A43]">
                {trackingCode}
              </div>
              {copyMessage && (
                <p className="mt-3 text-sm font-bold text-[#0E8F8A]">{copyMessage}</p>
              )}
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={handleCopyTrackingCode}
                  className="salamax-primary rounded-2xl px-5 py-3 font-bold"
                >
                  کپی کد پیگیری
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="rounded-2xl border border-teal-200 bg-white px-5 py-3 font-bold text-[#0E8F8A] hover:bg-teal-50"
                >
                  مشاهده جزئیات
                </button>
                {isAppOrigin && (
                  <button
                    type="button"
                    onClick={handleReturnToApp}
                    className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3 font-bold text-[#0E8F8A] hover:bg-teal-100/60"
                  >
                    بازگشت به اپ سلامکس
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-[#D7ECEF] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900">
              شرح اولیه مراجعه
            </h2>

            {intakeData ? (
              <div className="mt-5 space-y-3 leading-7 text-[#183B56]">
                <p>
                  <span className="font-bold">شرح کاربر:</span>{" "}
                  {intakeData.chiefComplaint}
                </p>
                <p>
                  <span className="font-bold">مسیر:</span>{" "}
                  {getFlowLabel(intakeData.detectedFlow)}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-[#64748B]">شرح اولیه ثبت نشده است.</p>
            )}
          </section>

          <section className="rounded-3xl border border-[#D7ECEF] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900">
              پزشک انتخاب‌شده
            </h2>

            {selectedDoctorForDisplay ? (
              <div className="mt-5 space-y-3 leading-7 text-[#183B56]">
                <p>
                  <span className="font-bold">پزشک:</span>{" "}
                  {selectedDoctorForDisplay.doctorName}
                </p>
                <p>
                  <span className="font-bold">تخصص:</span>{" "}
                  {selectedDoctorForDisplay.specialty}
                </p>
                <p>
                  <span className="font-bold">مرکز درمانی:</span>{" "}
                  {selectedDoctorForDisplay.clinic}
                </p>
                <p>
                  <span className="font-bold">زمان نوبت:</span>{" "}
                  {selectedDoctorForDisplay.available}
                </p>
                <p>
                  <span className="font-bold">نوع ویزیت انتخابی:</span>{" "}
                  {getVisitModeLabel(visitPreference?.visitMode)}
                </p>
                <p>
                  <span className="font-bold">اولویت بیمار:</span>{" "}
                  {getPriorityLabel(visitPreference?.priority)}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-[#64748B]">
                هنوز پزشکی برای رزرو انتخاب نشده است.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm">
          <h2 className="text-xl font-bold text-blue-900">
            اولویت و نوع ویزیت
          </h2>

          <div className="mt-5 grid gap-3 text-gray-700 md:grid-cols-2">
            <p>
              <span className="font-bold">نوع ویزیت:</span>{" "}
              {getVisitModeLabel(visitPreference?.visitMode)}
            </p>
            <p>
              <span className="font-bold">اولویت بیمار:</span>{" "}
              {getPriorityLabel(visitPreference?.priority)}
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-[#D7ECEF] bg-white p-6 text-[#183B56]">
            <h2 className="text-xl font-bold text-blue-900">
              اطلاعات محل درد
            </h2>

            {bodyMapData ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">ناحیه درد:</span>{" "}
                  {bodyMapData.selectedLabel}
                </p>
                <p>
                  <span className="font-bold">شدت درد:</span>{" "}
                  {bodyMapData.painLevel} از ۱۰
                </p>
              </div>
            ) : (
              <p className="mt-5 text-[#64748B]">
                برای این مسیر، اطلاعات نقشه بدن ثبت نشده است.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#D7ECEF] bg-white p-6 text-[#183B56]">
            <h2 className="text-xl font-bold text-blue-900">دلیل مراجعه</h2>

            {visitReasonData ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">دلیل انتخاب‌شده:</span>{" "}
                  {visitReasonData.reason}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-[#64748B]">
                دلیل مراجعه جداگانه ثبت نشده است.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-[#D7ECEF] bg-white p-6 text-[#183B56]">
          <h2 className="text-xl font-bold text-blue-900">
            مدارک انتخاب‌شده
          </h2>

          {uploadedFiles.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {uploadedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="rounded-xl border border-[#D7ECEF] bg-[#F6FBFC] p-4 text-sm text-[#183B56]"
                >
                  <p className="font-medium">{file.name}</p>
                  <p className="mt-1 text-[#64748B]">
                    {file.type || "نوع نامشخص"} · {file.size} بایت
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[#64748B]">
              هیچ مدرکی برای این رزرو آزمایشی انتخاب نشده است.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <h2 className="text-xl font-bold text-teal-900">
            خلاصه قابل ارسال به پزشک
          </h2>

          <p className="mt-4 leading-8 text-teal-950">
            {petCase
              ? "این مورد مربوط به حیوان خانگی است و برای بررسی بیشتر، مسیر دامپزشکی پیشنهاد می‌شود."
              : triageResult?.doctor_summary ??
                "خلاصه تحلیل اولیه هنوز ثبت نشده است."}
          </p>

          {bookingResponse && (
            <div className="mt-5 rounded-2xl border border-[#D7ECEF] bg-white p-5 text-[#183B56]">
              <h3 className="font-bold">خلاصه رزرو</h3>
              <p className="mt-3 leading-8">
                {bookingResponse.patient_summary}
              </p>
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={isSubmitting || !selectedDoctorForDisplay || !triageResult}
            className={`w-full rounded-2xl px-6 py-3 text-center font-bold transition sm:w-auto ${
              !isSubmitting && selectedDoctorForDisplay && triageResult
                ? "bg-[#20C9C3] text-[#102A43] shadow-sm hover:bg-[#0E8F8A] hover:text-white"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            {isSubmitting ? "در حال ثبت رزرو..." : "تأیید نهایی رزرو آزمایشی"}
          </button>

          <Link
            href="/summary"
            className="w-full rounded-2xl border border-teal-300 px-6 py-3 text-center text-teal-700 hover:bg-teal-50 sm:w-auto"
          >
            مشاهده خلاصه نهایی
          </Link>

          <Link
            href="/doctor-match"
            className="w-full rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8] sm:w-auto"
          >
            بازگشت به پزشکان
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
