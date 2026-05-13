"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FlowStepper from "@/components/FlowStepper";

type DetectedFlow =
  | "pain_flow"
  | "general_visit_flow"
  | "emergency_flow"
  | "veterinary_flow";

type IntakeData = {
  chiefComplaint: string;
  detectedFlow: DetectedFlow;
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

type TriageResponse = {
  risk_label: string;
  urgency?: "routine" | "soon" | "today" | "urgent";
  profileType?: "human" | "pet";
  detectedFlow?: DetectedFlow;
  visit_recommendation: string;
  suggested_specialty: string;
  doctor_summary: string;
  safety_notice: string;
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

function getRiskLabel(painLevel: number) {
  if (painLevel <= 3) return "سبز";
  if (painLevel <= 6) return "زرد";
  if (painLevel <= 8) return "نارنجی";
  return "قرمز";
}

function getVisitRecommendation(painLevel: number) {
  if (painLevel <= 3) return "مراجعه معمولی در صورت ادامه علائم";
  if (painLevel <= 6) return "مراجعه طی ۲۴ تا ۴۸ ساعت";
  if (painLevel <= 8) return "مراجعه در اولین فرصت، ترجیحاً امروز";
  return "بررسی فوری یا تماس با اورژانس در صورت وجود علائم خطر";
}

function getSpecialtyForRegion(region: string | null) {
  if (region === "chest") return "قلب و عروق / داخلی";
  if (region === "abdomen") return "داخلی / گوارش";
  if (region === "head") return "مغز و اعصاب / داخلی";
  if (["neck", "upper-back", "lower-back"].includes(region ?? "")) {
    return "ارتوپدی / طب فیزیکی";
  }
  if (
    [
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
    ].includes(region ?? "")
  ) {
    return "ارتوپدی / طب فیزیکی";
  }
  return "پزشک عمومی / داخلی";
}

function getVisitReasonSpecialty(reason?: string) {
  switch (reason) {
    case "چکاپ عمومی":
      return "پزشک عمومی / داخلی";
    case "بررسی جواب آزمایش":
      return "داخلی / پزشک عمومی";
    case "تمدید نسخه":
      return "پزشک مربوطه / پزشک عمومی";
    case "مشاوره تخصصی":
      return "پزشک عمومی برای ارجاع / تخصص مرتبط";
    case "پیگیری بیماری قبلی":
      return "تخصص مرتبط با بیماری قبلی";
    case "مشاوره دارویی":
      return "پزشک عمومی / داروساز بالینی";
    default:
      return "پزشک عمومی";
  }
}

function getVisitReasonRisk(reason?: string) {
  if (
    reason === "بررسی جواب آزمایش" ||
    reason === "مشاوره تخصصی" ||
    reason === "پیگیری بیماری قبلی"
  ) {
    return "زرد";
  }

  return "سبز";
}

function hasVeterinarySignal(value?: string | null) {
  const text = value?.trim() ?? "";
  return (
    text.includes("دامپزشک") ||
    text.includes("دامپزشکی") ||
    text.includes("حیوان خانگی")
  );
}

function isPetCase(intake: IntakeData | null, triageResult?: TriageResponse | null) {
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

function buildTriageResult(
  intake: IntakeData | null,
  bodyMap: BodyMapData | null,
  visitReason: VisitReasonData | null,
  uploadedFiles: UploadedFileInfo[]
): TriageResponse {
  const safetyNotice =
    "این خروجی صرفاً برای راهنمایی اولیه است و جایگزین تشخیص، معاینه یا نظر پزشک نیست. در صورت وجود علائم شدید مانند درد قفسه سینه، تنگی نفس، ضعف ناگهانی، بیهوشی یا خونریزی شدید، فوراً با اورژانس تماس بگیرید.";
  const veterinarySafetyNotice =
    "این مسیر جایگزین معاینه دامپزشک نیست. در علائم شدید یا تغییر ناگهانی وضعیت حیوان، با دامپزشک یا مرکز دامپزشکی تماس بگیرید. This path does not replace a veterinarian. For severe symptoms or sudden changes, contact a veterinarian or veterinary clinic.";

  if (isPetCase(intake)) {
    return {
      risk_label: "سبز",
      urgency: "routine",
      profileType: "pet",
      detectedFlow: "veterinary_flow",
      visit_recommendation:
        "در صورت ادامه علائم، یک نوبت دامپزشکی رزرو کنید.",
      suggested_specialty: "دامپزشک",
      doctor_summary:
        "این مورد مربوط به حیوان خانگی است و برای بررسی بیشتر، مسیر دامپزشکی پیشنهاد می‌شود.",
      safety_notice: veterinarySafetyNotice,
    };
  }

  if (intake?.detectedFlow === "emergency_flow" && !bodyMap && !visitReason) {
    return {
      risk_label: "قرمز",
      visit_recommendation: "تماس فوری با اورژانس یا مراجعه فوری",
      suggested_specialty: "اورژانس / پزشک عمومی",
      doctor_summary: `شرح اولیه بیمار: ${intake.chiefComplaint}. سامانه علائم هشدار را در متن اولیه تشخیص داده است و ادامه مسیر فقط با احتیاط انجام شده است.`,
      safety_notice: safetyNotice,
    };
  }

  if (bodyMap) {
    const riskLabel = getRiskLabel(bodyMap.painLevel);
    const suggestedSpecialty = getSpecialtyForRegion(bodyMap.selectedRegion);

    return {
      risk_label: riskLabel,
      visit_recommendation: getVisitRecommendation(bodyMap.painLevel),
      suggested_specialty: suggestedSpecialty,
      doctor_summary: `شرح اولیه بیمار: ${
        intake?.chiefComplaint || "ثبت نشده"
      }. بیمار ناحیه ${
        bodyMap.selectedLabel || "نامشخص"
      } را به عنوان محل اصلی درد یا ناراحتی انتخاب کرده است. شدت درد ${
        bodyMap.painLevel
      } از ۱۰ ثبت شده است. توضیح بیمار: ${
        bodyMap.description || "توضیحی ثبت نشده است"
      }. تعداد مدارک پزشکی انتخاب‌شده: ${
        uploadedFiles.length
      }. درجه هشدار ${riskLabel} و تخصص پیشنهادی ${suggestedSpecialty} است.`,
      safety_notice: safetyNotice,
    };
  }

  const reason = visitReason?.reason || "سایر موارد";
  const riskLabel = getVisitReasonRisk(reason);
  const suggestedSpecialty = getVisitReasonSpecialty(reason);

  return {
    risk_label: riskLabel,
    visit_recommendation:
      riskLabel === "زرد"
        ? "مراجعه برنامه‌ریزی‌شده در زمان مناسب"
        : "مراجعه معمولی و قابل برنامه‌ریزی",
    suggested_specialty: suggestedSpecialty,
    doctor_summary: `شرح اولیه بیمار: ${
      intake?.chiefComplaint || visitReason?.chiefComplaint || "ثبت نشده"
    }. دلیل مراجعه انتخاب‌شده: ${reason}. در این مسیر درد موضعی ثبت نشده و نقشه بدن لازم نبوده است. تعداد مدارک پزشکی انتخاب‌شده: ${
      uploadedFiles.length
    }. درجه هشدار ${riskLabel} و تخصص پیشنهادی ${suggestedSpecialty} است.`,
    safety_notice: safetyNotice,
  };
}

function getRiskStyles(label: string) {
  switch (label) {
    case "سبز":
      return {
        box: "border-green-300 bg-green-50",
        title: "text-green-900",
        value: "text-green-700",
      };
    case "زرد":
      return {
        box: "border-yellow-300 bg-yellow-50",
        title: "text-yellow-900",
        value: "text-yellow-700",
      };
    case "نارنجی":
      return {
        box: "border-orange-300 bg-orange-50",
        title: "text-orange-900",
        value: "text-orange-700",
      };
    case "قرمز":
      return {
        box: "border-red-300 bg-red-50",
        title: "text-red-900",
        value: "text-red-700",
      };
    default:
      return {
        box: "border-[#D7ECEF] bg-white",
        title: "text-gray-900",
        value: "text-gray-700",
      };
  }
}

function getEditHref(
  bodyMapData: BodyMapData | null,
  visitReasonData: VisitReasonData | null
) {
  if (bodyMapData) return "/body-map";
  if (visitReasonData) return "/visit-reason";
  return "/intake";
}

export default function ResultsPage() {
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
  const [documentAnalyses] = useState<DocumentAnalysis[]>(() =>
    safeReadStorage<DocumentAnalysis[]>("salamax_document_analyses") ?? []
  );
  const [isFromApp] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("salamax_from_app") === "true"
  );

  const triageResult = useMemo(() => {
    const result = buildTriageResult(
      intakeData,
      bodyMapData,
      visitReasonData,
      uploadedFiles
    );

    if (typeof window !== "undefined") {
      localStorage.setItem("salamax_triage_result", JSON.stringify(result));
    }

    return result;
  }, [bodyMapData, intakeData, uploadedFiles, visitReasonData]);

  const petCase = isPetCase(intakeData, triageResult);
  const riskStyles = getRiskStyles(triageResult.risk_label);

  function handleReturnToApp() {
    window.location.href = "salamax://home";
    window.setTimeout(() => {
      alert("برای بازگشت، اپلیکیشن سلامکس را باز کنید.");
    }, 700);
  }

  return (
    <main className="min-h-screen bg-[#F6FBFC] px-4 py-8 text-[#183B56] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <FlowStepper currentStep="analysis" />
        {isFromApp && (
          <span className="salamax-app-badge mb-4 rounded-full px-4 py-2 text-sm font-bold">
            ادامه از اپلیکیشن سلامکس
          </span>
        )}
      <div className="rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(95,221,218,0.18)] bg-[rgba(39,214,208,0.08)] px-4 py-2 text-sm font-bold text-[#27D6D0]">
          تحلیل اولیه Sandbox
        </span>
        <h1 className="mt-4 text-3xl font-bold text-blue-950">
          نتیجه تحلیل اولیه
        </h1>

            <p className="mt-3 leading-8 text-[#64748B]">
          این نتیجه با منطق frontend sandbox ساخته می‌شود. این سامانه تشخیص
          قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی اولیه و هدایت مسیر
          مراجعه طراحی شده است.
        </p>

        {intakeData?.detectedFlow === "emergency_flow" && (
          <div className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-6 text-red-950">
            <h2 className="text-xl font-bold">هشدار علائم خطر</h2>
            <p className="mt-3 leading-8">
              اگر علائم شدید یا خطرناک دارید، منتظر ادامه فرآیند سامانه نمانید
              و فوراً با اورژانس تماس بگیرید.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className={`rounded-3xl border p-6 shadow-sm ${riskStyles.box}`}>
            <h2 className={`text-lg font-bold ${riskStyles.title}`}>
              درجه هشدار
            </h2>

            <p className={`mt-3 text-3xl font-bold ${riskStyles.value}`}>
              {triageResult.risk_label}
            </p>
          </div>

          <div className="rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm">
            <h2 className="text-lg font-bold text-blue-900">
              زمان پیشنهادی مراجعه
            </h2>

            <p className="mt-3 text-2xl font-bold text-blue-800">
              {triageResult.visit_recommendation}
            </p>
          </div>

          <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-teal-900">
              تخصص پیشنهادی
            </h2>

            <p className="mt-3 text-2xl font-bold text-teal-800">
              {triageResult.suggested_specialty}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
          <h2 className="font-bold text-blue-900">خلاصه داده‌های ورودی</h2>
          <div className="mt-3 grid gap-3 text-sm leading-7 md:grid-cols-2">
            <p>
              <span className="font-bold">شرح اولیه:</span>{" "}
              {intakeData?.chiefComplaint || "ثبت نشده"}
            </p>
            <p>
              <span className="font-bold">نوع مسیر:</span>{" "}
              {petCase
                ? "مسیر دامپزشکی"
                : bodyMapData
                ? "مسیر درد"
                : visitReasonData
                ? "مسیر مراجعه عمومی"
                : "اطلاعات اولیه"}
            </p>
            <p>
              <span className="font-bold">دلیل مراجعه:</span>{" "}
              {visitReasonData?.reason || "ثبت نشده"}
            </p>
            <p>
              <span className="font-bold">تعداد مدارک:</span>{" "}
              {uploadedFiles.length}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-[#D7ECEF] bg-white p-6 text-[#183B56]">
            <h2 className="text-xl font-bold text-blue-900">
              شرح اولیه و مسیر
            </h2>

            <div className="mt-4 space-y-3 leading-7 text-gray-700">
              <p>
                <span className="font-bold">شرح کاربر:</span>{" "}
                {intakeData?.chiefComplaint || "ثبت نشده"}
              </p>
              <p>
                <span className="font-bold">مسیر تشخیص‌داده‌شده:</span>{" "}
                {petCase
                  ? "مسیر دامپزشکی"
                  : bodyMapData
                  ? "محل درد"
                  : visitReasonData
                  ? "دلیل مراجعه"
                  : "علائم هشدار / مسیر عمومی"}
              </p>
              {visitReasonData && (
                <p>
                  <span className="font-bold">دلیل مراجعه:</span>{" "}
                  {visitReasonData.reason}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#D7ECEF] bg-white p-6 text-[#183B56]">
            <h2 className="text-xl font-bold text-blue-900">
              اطلاعات محل درد
            </h2>

            {bodyMapData ? (
              <div className="mt-4 space-y-3 leading-7 text-gray-700">
                <p>
                  <span className="font-bold">ناحیه درد:</span>{" "}
                  {bodyMapData.selectedLabel}
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
              <p className="mt-4 leading-7 text-[#64748B]">
                برای این مسیر، نقشه بدن لازم نبوده است.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-[#D7ECEF] bg-white p-6 text-[#183B56]">
          <h2 className="text-xl font-bold text-blue-900">
            خلاصه اولیه برای پزشک
          </h2>

          <p className="mt-4 leading-8 text-gray-700">
            {triageResult.doctor_summary}
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-teal-200 bg-teal-50 p-6 text-teal-950">
          <h2 className="text-xl font-bold text-teal-900">
            Document Agent Summary
          </h2>
          <p className="mt-2 text-sm leading-7 text-teal-800">
            تحلیل مدارک در نسخه Sandbox توسط Document Agent انجام شده و نیازمند
            تأیید پزشک است.
          </p>

          {documentAnalyses.length > 0 ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl border border-[#D7ECEF] bg-[#F6FBFC] p-4">
                  <span className="font-bold">تعداد مدارک تحلیل‌شده:</span>{" "}
                  {documentAnalyses.length}
                </div>
                <div className="rounded-2xl border border-[#D7ECEF] bg-[#F6FBFC] p-4">
                  <span className="font-bold">نوع مدارک:</span>{" "}
                  {documentAnalyses
                    .map((analysis) => analysis.documentType)
                    .join("، ")}
                </div>
                <div className="rounded-2xl border border-[#D7ECEF] bg-[#F6FBFC] p-4">
                  <span className="font-bold">موارد قابل توجه:</span>{" "}
                  {documentAnalyses.reduce(
                    (count, analysis) =>
                      count + analysis.abnormalFindings.length,
                    0
                  )}
                </div>
              </div>

              {documentAnalyses.map((analysis, index) => (
                <article
                  key={`${analysis.fileName ?? analysis.documentType}-${index}`}
                  className="rounded-2xl border border-[#D7ECEF] bg-white p-5"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h3 className="font-bold text-blue-900">
                      {analysis.fileName ?? `مدرک ${index + 1}`}
                    </h3>
                    {analysis.isMock && (
                      <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                        Mock Analysis
                      </span>
                    )}
                  </div>
                  <p className="mt-3 leading-8 text-gray-700">
                    <span className="font-bold">خلاصه پزشک:</span>{" "}
                    {analysis.doctorFacingSummary}
                  </p>
                  <p className="mt-2 leading-8 text-gray-700">
                    <span className="font-bold">اثر روی تریاژ:</span>{" "}
                    {analysis.triageImpact}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 leading-7 text-teal-800">
              هنوز مدرکی توسط Document Agent تحلیل نشده است.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
          <h3 className="font-bold">یادآوری ایمنی</h3>
          <p className="mt-2 text-sm leading-7">
            {triageResult.safety_notice}
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isFromApp && (
            <button
              type="button"
              onClick={handleReturnToApp}
              className="rounded-2xl border border-teal-300 px-6 py-3 text-center text-teal-100 hover:bg-teal-500/10 sm:w-auto"
            >
              بازگشت به اپلیکیشن
            </button>
          )}
          <Link
            href="/visit-preference"
            className="w-full rounded-2xl bg-[#20C9C3] px-6 py-3 text-center font-bold text-[#102A43] shadow-sm hover:bg-[#0E8F8A] hover:text-white sm:w-auto"
          >
            تنظیم اولویت و انتخاب پزشک
          </Link>

          <Link
            href="/upload"
            className="w-full rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8] sm:w-auto"
          >
            بازگشت به مدارک
          </Link>

          <Link
            href={getEditHref(bodyMapData, visitReasonData)}
            className="w-full rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8] sm:w-auto"
          >
            اصلاح اطلاعات
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
