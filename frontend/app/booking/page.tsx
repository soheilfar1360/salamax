"use client";

import { useState } from "react";
import Link from "next/link";

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
  selectedAt: string;
};

type TriageResponse = {
  risk_label: string;
  visit_recommendation: string;
  suggested_specialty: string;
  doctor_summary: string;
  safety_notice: string;
};

type IntakeData = {
  chiefComplaint: string;
  detectedFlow: "pain_flow" | "general_visit_flow" | "emergency_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
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
  return "مراجعه عمومی";
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
  const [bookingResponse, setBookingResponse] =
    useState<BookingConfirmation | null>(() =>
      safeReadStorage<BookingConfirmation>("salamax_booking_confirmation")
    );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleConfirmBooking() {
    setErrorMessage("");

    if (!selectedDoctor || !triageResult || !intakeData) {
      setErrorMessage(
        "اطلاعات لازم برای ثبت رزرو کامل نیست. لطفاً مسیر پیش‌ویزیت، نتیجه تحلیل و انتخاب پزشک را کامل طی کنید."
      );
      return;
    }

    setIsSubmitting(true);

    const patientSummary =
      bodyMapData !== null
        ? `شرح اولیه: ${intakeData.chiefComplaint}. محل درد: ${bodyMapData.selectedLabel}. شدت درد: ${bodyMapData.painLevel} از ۱۰. درجه هشدار: ${triageResult.risk_label}. تخصص پیشنهادی: ${triageResult.suggested_specialty}.`
        : `شرح اولیه: ${intakeData.chiefComplaint}. دلیل مراجعه: ${
            visitReasonData?.reason || "ثبت نشده"
          }. درجه هشدار: ${triageResult.risk_label}. تخصص پیشنهادی: ${
            triageResult.suggested_specialty
          }.`;

    const confirmation: BookingConfirmation = {
      booking_id: createBookingId(),
      status: "confirmed",
      message: "رزرو آزمایشی با موفقیت در مرورگر ثبت شد.",
      doctor_name: selectedDoctor.doctorName,
      appointment_time: selectedDoctor.available,
      patient_summary: patientSummary,
      confirmedAt: new Date().toISOString(),
      doctor: selectedDoctor,
      intake: intakeData,
      bodyMap: bodyMapData,
      visitReason: visitReasonData,
      uploadedFiles,
      triageResult,
    };

    localStorage.setItem(
      "salamax_booking_confirmation",
      JSON.stringify(confirmation)
    );
    setBookingResponse(confirmation);
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-blue-900">
          تأیید رزرو نوبت
        </h1>

        <p className="mt-3 leading-8 text-gray-600">
          در این مرحله، اطلاعات مسیر پیش‌ویزیت، پزشک انتخاب‌شده و خلاصه تحلیل
          برای ثبت رزرو آزمایشی در مرورگر آماده می‌شود.
          این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی اولیه
          و هدایت مسیر مراجعه طراحی شده است.
        </p>

        {bookingResponse && (
          <div className="mt-8 rounded-3xl border border-green-300 bg-green-50 p-6 text-green-900 shadow-sm">
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

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              شرح اولیه مراجعه
            </h2>

            {intakeData ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
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
              <p className="mt-5 text-gray-600">شرح اولیه ثبت نشده است.</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              پزشک انتخاب‌شده
            </h2>

            {selectedDoctor ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">پزشک:</span>{" "}
                  {selectedDoctor.doctorName}
                </p>
                <p>
                  <span className="font-bold">تخصص:</span>{" "}
                  {selectedDoctor.specialty}
                </p>
                <p>
                  <span className="font-bold">مرکز درمانی:</span>{" "}
                  {selectedDoctor.clinic}
                </p>
                <p>
                  <span className="font-bold">زمان نوبت:</span>{" "}
                  {selectedDoctor.available}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                هنوز پزشکی برای رزرو انتخاب نشده است.
              </p>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-6">
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
              <p className="mt-5 text-gray-600">
                برای این مسیر، اطلاعات نقشه بدن ثبت نشده است.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-blue-900">دلیل مراجعه</h2>

            {visitReasonData ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">دلیل انتخاب‌شده:</span>{" "}
                  {visitReasonData.reason}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                دلیل مراجعه جداگانه ثبت نشده است.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-blue-900">
            مدارک انتخاب‌شده
          </h2>

          {uploadedFiles.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {uploadedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="rounded-xl bg-slate-50 p-4 text-sm text-gray-700"
                >
                  <p className="font-medium">{file.name}</p>
                  <p className="mt-1 text-gray-500">
                    {file.type || "نوع نامشخص"} · {file.size} بایت
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-gray-600">
              هیچ مدرکی برای این رزرو آزمایشی انتخاب نشده است.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <h2 className="text-xl font-bold text-teal-900">
            خلاصه قابل ارسال به پزشک
          </h2>

          <p className="mt-4 leading-8 text-teal-950">
            {triageResult?.doctor_summary ??
              "خلاصه تحلیل اولیه هنوز ثبت نشده است."}
          </p>

          {bookingResponse && (
            <div className="mt-5 rounded-2xl border border-teal-300 bg-white p-5 text-teal-950">
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
            disabled={isSubmitting || !selectedDoctor || !triageResult}
            className={`rounded-xl px-6 py-3 text-center text-white transition ${
              !isSubmitting && selectedDoctor && triageResult
                ? "bg-blue-900 hover:bg-blue-800"
                : "cursor-not-allowed bg-gray-400"
            }`}
          >
            {isSubmitting ? "در حال ثبت رزرو..." : "تأیید نهایی رزرو آزمایشی"}
          </button>

          <Link
            href="/summary"
            className="rounded-xl border border-teal-300 px-6 py-3 text-center text-teal-700 hover:bg-teal-50"
          >
            مشاهده خلاصه نهایی
          </Link>

          <Link
            href="/doctor-match"
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            بازگشت به پزشکان
          </Link>
        </div>
      </div>
    </main>
  );
}
