"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

type TriageResponse = {
  risk_label: string;
  visit_recommendation: string;
  suggested_specialty: string;
  doctor_summary: string;
  safety_notice: string;
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

function buildTriageResult(
  intake: IntakeData | null,
  bodyMap: BodyMapData | null,
  visitReason: VisitReasonData | null,
  uploadedFiles: UploadedFileInfo[]
): TriageResponse {
  const safetyNotice =
    "این خروجی صرفاً برای راهنمایی اولیه است و جایگزین تشخیص، معاینه یا نظر پزشک نیست. در صورت وجود علائم شدید مانند درد قفسه سینه، تنگی نفس، ضعف ناگهانی، بیهوشی یا خونریزی شدید، فوراً با اورژانس تماس بگیرید.";

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
        box: "border-gray-300 bg-gray-50",
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

  const riskStyles = getRiskStyles(triageResult.risk_label);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-blue-900">
          نتیجه تحلیل اولیه
        </h1>

        <p className="mt-3 leading-8 text-gray-600">
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
          <div className={`rounded-2xl border p-6 ${riskStyles.box}`}>
            <h2 className={`text-lg font-bold ${riskStyles.title}`}>
              درجه هشدار
            </h2>

            <p className={`mt-3 text-3xl font-bold ${riskStyles.value}`}>
              {triageResult.risk_label}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-lg font-bold text-blue-900">
              زمان پیشنهادی مراجعه
            </h2>

            <p className="mt-3 text-2xl font-bold text-blue-800">
              {triageResult.visit_recommendation}
            </p>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
            <h2 className="text-lg font-bold text-teal-900">
              تخصص پیشنهادی
            </h2>

            <p className="mt-3 text-2xl font-bold text-teal-800">
              {triageResult.suggested_specialty}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
          <h2 className="font-bold text-blue-900">خلاصه داده‌های ورودی</h2>
          <div className="mt-3 grid gap-3 text-sm leading-7 md:grid-cols-2">
            <p>
              <span className="font-bold">شرح اولیه:</span>{" "}
              {intakeData?.chiefComplaint || "ثبت نشده"}
            </p>
            <p>
              <span className="font-bold">نوع مسیر:</span>{" "}
              {bodyMapData
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
          <section className="rounded-2xl border border-gray-200 p-6">
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
                {bodyMapData
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

          <section className="rounded-2xl border border-gray-200 p-6">
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
              <p className="mt-4 leading-7 text-gray-600">
                برای این مسیر، نقشه بدن لازم نبوده است.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-blue-900">
            خلاصه اولیه برای پزشک
          </h2>

          <p className="mt-4 leading-8 text-gray-700">
            {triageResult.doctor_summary}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
          <h3 className="font-bold">یادآوری ایمنی</h3>
          <p className="mt-2 text-sm leading-7">
            {triageResult.safety_notice}
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/doctor-match"
            className="rounded-xl bg-blue-900 px-6 py-3 text-center text-white hover:bg-blue-800"
          >
            مشاهده پزشکان پیشنهادی
          </Link>

          <Link
            href="/upload"
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            بازگشت به مدارک
          </Link>

          <Link
            href={getEditHref(bodyMapData, visitReasonData)}
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            اصلاح اطلاعات
          </Link>
        </div>
      </div>
    </main>
  );
}
