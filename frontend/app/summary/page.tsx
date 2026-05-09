"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DetectedFlow = "pain_flow" | "general_visit_flow" | "emergency_flow";

type IntakeData = {
  chiefComplaint: string;
  detectedFlow: DetectedFlow;
  hasPain: boolean;
  requiresBodyMap: boolean;
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
  visit_recommendation: string;
  suggested_specialty: string;
  doctor_summary: string;
  safety_notice: string;
};

type BookingConfirmation = {
  booking_id: string;
  status: string;
  message: string;
  doctor_name: string;
  appointment_time: string;
  patient_summary: string;
  confirmedAt: string;
  doctor?: SelectedDoctor;
  intake?: IntakeData | null;
  bodyMap?: BodyMapData | null;
  visitReason?: VisitReasonData | null;
  visitPreference?: VisitPreference | null;
  uploadedFiles?: UploadedFileInfo[];
  triageResult?: TriageResponse | null;
};

type DocumentAnalysis = {
  documentType: string;
  detectedLanguage: string;
  extractedTextSummary: string;
  abnormalFindings: Array<{
    name: string;
    value: string;
    referenceRange?: string;
    status: "low" | "high" | "normal" | "unknown";
    note: string;
  }>;
  plainLanguageSummary: string;
  doctorFacingSummary: string;
  triageImpact: string;
  recommendedSpecialtyHint: string;
  confidence: "low" | "medium" | "high";
  safetyDisclaimer: string;
  isMock?: boolean;
  fileName?: string;
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

function formatDate(dateString?: string) {
  if (!dateString) return "ثبت نشده";

  try {
    return new Date(dateString).toLocaleString("fa-IR");
  } catch {
    return "ثبت نشده";
  }
}

function getFlowLabel(flow?: DetectedFlow) {
  if (flow === "pain_flow") return "درد یا ناراحتی موضعی";
  if (flow === "emergency_flow") return "علائم هشدار";
  if (flow === "general_visit_flow") return "مراجعه عمومی";
  return "ثبت نشده";
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

function getRiskStyle(label?: string) {
  switch (label) {
    case "سبز":
      return "border-green-300 bg-green-50 text-green-900";
    case "زرد":
      return "border-yellow-300 bg-yellow-50 text-yellow-900";
    case "نارنجی":
      return "border-orange-300 bg-orange-50 text-orange-900";
    case "قرمز":
      return "border-red-300 bg-red-50 text-red-900";
    default:
      return "border-gray-300 bg-gray-50 text-gray-900";
  }
}

export default function SummaryPage() {
  const router = useRouter();
  const [intakeData, setIntakeData] = useState<IntakeData | null>(() =>
    safeReadStorage<IntakeData>("salamax_intake")
  );
  const [bodyMapData, setBodyMapData] = useState<BodyMapData | null>(() =>
    safeReadStorage<BodyMapData>("salamax_body_map")
  );
  const [visitReasonData, setVisitReasonData] =
    useState<VisitReasonData | null>(() =>
      safeReadStorage<VisitReasonData>("salamax_visit_reason")
    );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>(() =>
    safeReadStorage<UploadedFileInfo[]>("salamax_uploaded_files") ?? []
  );
  const [selectedDoctor, setSelectedDoctor] = useState<SelectedDoctor | null>(
    () => safeReadStorage<SelectedDoctor>("salamax_selected_doctor")
  );
  const [triageResult, setTriageResult] = useState<TriageResponse | null>(() =>
    safeReadStorage<TriageResponse>("salamax_triage_result")
  );
  const [documentAnalyses, setDocumentAnalyses] = useState<DocumentAnalysis[]>(
    () => safeReadStorage<DocumentAnalysis[]>("salamax_document_analyses") ?? []
  );
  const [visitPreference, setVisitPreference] =
    useState<VisitPreference | null>(() =>
      safeReadStorage<VisitPreference>("salamax_visit_preference")
    );
  const [bookingConfirmation, setBookingConfirmation] =
    useState<BookingConfirmation | null>(() =>
      safeReadStorage<BookingConfirmation>("salamax_booking_confirmation")
    );

  const effectiveTriage =
    triageResult ?? bookingConfirmation?.triageResult ?? null;
  const effectiveDoctor =
    selectedDoctor ?? bookingConfirmation?.doctor ?? null;
  const effectiveVisitPreference =
    visitPreference ?? bookingConfirmation?.visitPreference ?? null;
  const effectiveUploadedFiles =
    uploadedFiles.length > 0
      ? uploadedFiles
      : bookingConfirmation?.uploadedFiles ?? [];
  const riskStyle = getRiskStyle(effectiveTriage?.risk_label);

  function clearDemoData() {
    localStorage.removeItem("salamax_intake");
    localStorage.removeItem("salamax_body_map");
    localStorage.removeItem("salamax_visit_reason");
    localStorage.removeItem("salamax_uploaded_files");
    localStorage.removeItem("salamax_selected_doctor");
    localStorage.removeItem("salamax_triage_result");
    localStorage.removeItem("salamax_document_analyses");
    localStorage.removeItem("salamax_visit_preference");
    localStorage.removeItem("salamax_doctor_match");
    localStorage.removeItem("salamax_booking_confirmation");

    setIntakeData(null);
    setBodyMapData(null);
    setVisitReasonData(null);
    setUploadedFiles([]);
    setSelectedDoctor(null);
    setTriageResult(null);
    setDocumentAnalyses([]);
    setVisitPreference(null);
    setBookingConfirmation(null);
    router.push("/intake");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              خلاصه نهایی پیش‌ویزیت
            </h1>

            <p className="mt-3 max-w-3xl leading-8 text-gray-600">
              این صفحه مسیر کامل بیمار را از شرح اولیه تا نتیجه، پزشک پیشنهادی
              و رزرو آزمایشی نشان می‌دهد.
              این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی
              اولیه و هدایت مسیر مراجعه طراحی شده است.
            </p>
          </div>

          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-bold ${riskStyle}`}
          >
            درجه هشدار: {effectiveTriage?.risk_label ?? "ثبت نشده"}
          </div>
        </div>

        {intakeData?.detectedFlow === "emergency_flow" && (
          <section className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950">
            <h2 className="font-bold">هشدار علائم خطر</h2>
            <p className="mt-2 text-sm leading-7">
              اگر علائم شدید یا خطرناک دارید، منتظر ادامه فرآیند سامانه نمانید
              و فوراً با اورژانس تماس بگیرید.
            </p>
          </section>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
            <p className="text-sm text-gray-500">مرحله ۱</p>
            <h2 className="mt-2 font-bold text-blue-900">شرح اولیه</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              {intakeData?.chiefComplaint || "ثبت نشده"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
            <p className="text-sm text-gray-500">مرحله ۲</p>
            <h2 className="mt-2 font-bold text-blue-900">مسیر تشخیص</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              {getFlowLabel(intakeData?.detectedFlow)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
            <p className="text-sm text-gray-500">مرحله ۳</p>
            <h2 className="mt-2 font-bold text-blue-900">
              {bodyMapData ? "محل درد" : "دلیل مراجعه"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              {bodyMapData?.selectedLabel ??
                visitReasonData?.reason ??
                "ثبت نشده"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
            <p className="text-sm text-gray-500">مرحله ۴</p>
            <h2 className="mt-2 font-bold text-blue-900">رزرو</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              {bookingConfirmation?.status === "confirmed"
                ? "رزرو آزمایشی ثبت شده"
                : "رزرو نهایی نشده"}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-bold text-blue-900">
            اولویت انتخاب پزشک
          </h2>

          {effectiveVisitPreference ? (
            <div className="mt-5 space-y-4 text-gray-700">
              <div className="grid gap-3 md:grid-cols-2">
                <p>
                  <span className="font-bold">نوع ویزیت:</span>{" "}
                  {getVisitModeLabel(effectiveVisitPreference.visitMode)}
                </p>
                <p>
                  <span className="font-bold">اولویت بیمار:</span>{" "}
                  {getPriorityLabel(effectiveVisitPreference.priority)}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 text-sm leading-7">
                <h3 className="font-bold text-blue-900">وزن‌دهی تطبیق پزشک</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <p>
                    تخصص:{" "}
                    {Math.round(effectiveVisitPreference.weights.specialty * 100)}
                    ٪
                  </p>
                  <p>
                    فاصله:{" "}
                    {Math.round(effectiveVisitPreference.weights.distance * 100)}
                    ٪
                  </p>
                  <p>
                    امتیاز:{" "}
                    {Math.round(effectiveVisitPreference.weights.rating * 100)}٪
                  </p>
                  <p>
                    زودترین نوبت:{" "}
                    {Math.round(
                      effectiveVisitPreference.weights.availability * 100
                    )}
                    ٪
                  </p>
                  <p>
                    خوش‌قولی:{" "}
                    {Math.round(
                      effectiveVisitPreference.weights.punctuality * 100
                    )}
                    ٪
                  </p>
                  <p>
                    نوع ویزیت:{" "}
                    {Math.round(effectiveVisitPreference.weights.visitMode * 100)}
                    ٪
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-gray-600">
              اولویت انتخاب پزشک جداگانه ثبت نشده است.
            </p>
          )}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              اطلاعات درد و علائم
            </h2>

            {bodyMapData ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">ناحیه انتخاب‌شده:</span>{" "}
                  {bodyMapData.selectedLabel}
                </p>
                <p>
                  <span className="font-bold">نمای بدن:</span>{" "}
                  {bodyMapData.viewMode === "front" ? "جلو" : "پشت"}
                </p>
                <p>
                  <span className="font-bold">شدت درد:</span>{" "}
                  {bodyMapData.painLevel} از ۱۰
                </p>
                {bodyMapData.description && (
                  <p>
                    <span className="font-bold">توضیح بیمار:</span>{" "}
                    {bodyMapData.description}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                برای این مسیر، نقشه بدن ثبت نشده است.
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
                <p>
                  <span className="font-bold">زمان ثبت:</span>{" "}
                  {formatDate(visitReasonData.createdAt)}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                دلیل مراجعه جداگانه ثبت نشده است.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-teal-200 bg-teal-50 p-6 text-teal-950">
          <h2 className="text-xl font-bold text-teal-900">
            تحلیل مدارک توسط Document Agent
          </h2>
          <p className="mt-2 text-sm leading-7 text-teal-800">
            این بخش تشخیص قطعی نیست و فقط خلاصه استخراج‌شده از مدارک را برای
            تأیید پزشک نشان می‌دهد.
          </p>

          {documentAnalyses.length > 0 ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-white p-4 text-sm">
                <span className="font-bold">تعداد مدارک تحلیل‌شده:</span>{" "}
                {documentAnalyses.length}
              </div>

              {documentAnalyses.map((analysis, index) => (
                <article
                  key={`${analysis.fileName ?? analysis.documentType}-${index}`}
                  className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-bold text-blue-900">
                        {analysis.fileName ?? `مدرک ${index + 1}`}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {analysis.documentType} · اطمینان:{" "}
                        {analysis.confidence}
                      </p>
                    </div>
                    {analysis.isMock && (
                      <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                        Mock Analysis
                      </span>
                    )}
                  </div>

                  <p className="mt-4 leading-8 text-gray-700">
                    {analysis.plainLanguageSummary}
                  </p>

                  {analysis.abnormalFindings.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <h4 className="font-bold text-blue-900">
                        موارد قابل توجه
                      </h4>
                      <div className="mt-3 grid gap-3">
                        {analysis.abnormalFindings.map((finding) => (
                          <div
                            key={`${finding.name}-${finding.value}`}
                            className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-gray-700"
                          >
                            <p className="font-bold">
                              {finding.name}: {finding.value}
                            </p>
                            <p className="mt-1">وضعیت: {finding.status}</p>
                            <p className="mt-1 text-gray-600">
                              {finding.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm leading-7 text-yellow-900">
                    {analysis.safetyDisclaimer}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 leading-7 text-teal-800">
              تحلیلی از مدارک در این دمو ثبت نشده است.
            </p>
          )}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              نتیجه تحلیل
            </h2>

            {effectiveTriage ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">درجه هشدار:</span>{" "}
                  {effectiveTriage.risk_label}
                </p>
                <p>
                  <span className="font-bold">زمان پیشنهادی مراجعه:</span>{" "}
                  {effectiveTriage.visit_recommendation}
                </p>
                <p>
                  <span className="font-bold">تخصص پیشنهادی:</span>{" "}
                  {effectiveTriage.suggested_specialty}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-gray-600">نتیجه‌ای ثبت نشده است.</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              مدارک پزشکی
            </h2>

            {effectiveUploadedFiles.length > 0 ? (
              <div className="mt-5 space-y-3">
                {effectiveUploadedFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="rounded-xl bg-slate-50 p-4 text-sm text-gray-700"
                  >
                    <p className="font-medium">{file.name}</p>
                    <p className="mt-1 text-gray-500">
                      نوع فایل: {file.type || "نامشخص"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                هیچ مدرکی در نسخه آزمایشی ثبت نشده است.
              </p>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              پزشک انتخاب‌شده
            </h2>

            {effectiveDoctor ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">پزشک:</span>{" "}
                  {effectiveDoctor.doctorName}
                </p>
                <p>
                  <span className="font-bold">تخصص:</span>{" "}
                  {effectiveDoctor.specialty}
                </p>
                <p>
                  <span className="font-bold">نوبت:</span>{" "}
                  {effectiveDoctor.available}
                </p>
                <p>
                  <span className="font-bold">امتیاز تطبیق:</span>{" "}
                  {effectiveDoctor.matchScore}٪
                </p>
                {effectiveDoctor.whyRecommended && (
                  <p>
                    <span className="font-bold">دلیل پیشنهاد:</span>{" "}
                    {effectiveDoctor.whyRecommended}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                هنوز پزشکی انتخاب نشده است.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              تأیید رزرو
            </h2>

            {bookingConfirmation ? (
              <div className="mt-5 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">کد رزرو:</span>{" "}
                  {bookingConfirmation.booking_id}
                </p>
                <p>
                  <span className="font-bold">وضعیت:</span>{" "}
                  {bookingConfirmation.status}
                </p>
                <p>
                  <span className="font-bold">زمان تأیید:</span>{" "}
                  {formatDate(bookingConfirmation.confirmedAt)}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                رزرو آزمایشی هنوز تأیید نشده است.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <h2 className="text-xl font-bold text-teal-900">
            خلاصه قابل ارائه به پزشک
          </h2>

          <p className="mt-4 leading-8 text-teal-950">
            {bookingConfirmation?.patient_summary ??
              effectiveTriage?.doctor_summary ??
              "خلاصه‌ای هنوز ثبت نشده است."}
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={clearDemoData}
            className="rounded-xl bg-blue-900 px-6 py-3 text-center text-white hover:bg-blue-800"
          >
            شروع دمو جدید
          </button>

          <Link
            href="/booking"
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            بازگشت به رزرو
          </Link>

        </div>
      </div>
    </main>
  );
}
