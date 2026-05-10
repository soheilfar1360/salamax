"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlowStepper from "@/components/FlowStepper";
import type { ReferralPayload } from "@/lib/referrals/types";

type DetectedFlow = "pain_flow" | "general_visit_flow" | "emergency_flow";

const painKeywords = [
  "درد",
  "سوزش",
  "تیر",
  "تیرکشیدن",
  "فشار",
  "گرفتگی",
  "کوفتگی",
  "ورم",
  "التهاب",
  "دردناک",
  "pain",
  "ache",
  "burning",
  "pressure",
  "cramp",
  "swelling",
];

const generalVisitKeywords = [
  "چکاپ",
  "آزمایش",
  "جواب آزمایش",
  "نسخه",
  "تمدید نسخه",
  "مشاوره",
  "کنترل",
  "پیگیری",
  "دارو",
  "بررسی",
  "واکسن",
  "checkup",
  "lab",
  "prescription",
  "consultation",
  "follow-up",
  "medication",
];

const emergencyKeywords = [
  "درد شدید قفسه سینه",
  "تنگی نفس",
  "بیهوشی",
  "غش",
  "خونریزی شدید",
  "ضعف ناگهانی",
  "بی‌حسی یک طرف بدن",
  "بی حسی یک طرف بدن",
  "سکته",
  "تشنج",
  "severe chest pain",
  "shortness of breath",
  "fainting",
  "severe bleeding",
  "stroke",
  "seizure",
];

function includesKeyword(text: string, keywords: string[]) {
  const normalized = text.trim().toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function detectFlow(text: string): {
  detectedFlow: DetectedFlow;
  hasPain: boolean;
  requiresBodyMap: boolean;
} {
  const hasPain = includesKeyword(text, painKeywords);
  const hasGeneralVisitReason = includesKeyword(text, generalVisitKeywords);
  const hasEmergency = includesKeyword(text, emergencyKeywords);

  if (hasEmergency) {
    return {
      detectedFlow: "emergency_flow",
      hasPain,
      requiresBodyMap: hasPain,
    };
  }

  if (hasPain) {
    return {
      detectedFlow: "pain_flow",
      hasPain: true,
      requiresBodyMap: true,
    };
  }

  return {
    detectedFlow: hasGeneralVisitReason
      ? "general_visit_flow"
      : "general_visit_flow",
    hasPain: false,
    requiresBodyMap: false,
  };
}

function getFlowLabel(flow?: DetectedFlow | null) {
  if (flow === "pain_flow") return "مسیر درد یا ناراحتی موضعی";
  if (flow === "emergency_flow") return "علائم هشدار";
  return "مسیر مراجعه عمومی";
}

function IntakePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralId = searchParams.get("referralId");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [validationError, setValidationError] = useState("");
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [referralPayload, setReferralPayload] =
    useState<ReferralPayload | null>(null);
  const [referralError, setReferralError] = useState("");
  const [isReferralLoading, setIsReferralLoading] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<"/body-map" | "/upload">(
    "/upload"
  );
  const [lastDetectedFlow, setLastDetectedFlow] =
    useState<DetectedFlow | null>(null);
  const isFamilyHandoff = searchParams.get("source") === "salamax_family";

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(async () => {
      if (!referralId) {
        if (isActive) {
          setReferralPayload(null);
          setReferralError("");
          setIsReferralLoading(false);
        }
        return;
      }

      if (isActive) {
        setReferralPayload(null);
        setReferralError("");
        setIsReferralLoading(true);
      }

      try {
        const response = await fetch(
          `/api/referrals/${encodeURIComponent(referralId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Referral not found");
        }

        const data = (await response.json()) as {
          referralId: string;
          payload: ReferralPayload;
        };

        if (isActive) {
          setReferralPayload(data.payload);
        }
      } catch {
        if (isActive) {
          setReferralError(
            "ارجاع سلامکس خانواده پیدا نشد یا دیگر در دسترس نیست. می‌توانید مسیر عادی پیش‌ویزیت را ادامه دهید."
          );
        }
      } finally {
        if (isActive) {
          setIsReferralLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
    };
  }, [referralId]);

  const characterCount = useMemo(() => chiefComplaint.trim().length, [
    chiefComplaint,
  ]);

  function saveIntake() {
    const classification = detectFlow(chiefComplaint);
    const intakeData = {
      chiefComplaint: chiefComplaint.trim(),
      detectedFlow: classification.detectedFlow,
      hasPain: classification.hasPain,
      requiresBodyMap: classification.requiresBodyMap,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("salamax_intake", JSON.stringify(intakeData));
    localStorage.removeItem("salamax_body_map");
    localStorage.removeItem("salamax_visit_reason");
    localStorage.removeItem("salamax_uploaded_files");
    localStorage.removeItem("salamax_document_analyses");
    localStorage.removeItem("salamax_triage_result");
    localStorage.removeItem("salamax_visit_preference");
    localStorage.removeItem("salamax_doctor_match");
    localStorage.removeItem("salamax_selected_doctor");
    localStorage.removeItem("salamax_booking_confirmation");
    setLastDetectedFlow(classification.detectedFlow);

    return classification;
  }

  function handleContinue() {
    setValidationError("");
    setEmergencyDetected(false);

    if (!chiefComplaint.trim()) {
      setValidationError("برای شروع، یک جمله کوتاه درباره دلیل مراجعه بنویسید.");
      return;
    }

    const classification = saveIntake();

    if (classification.detectedFlow === "emergency_flow") {
      setEmergencyDetected(true);
      setPendingRoute(classification.hasPain ? "/body-map" : "/upload");
      return;
    }

    if (classification.detectedFlow === "pain_flow") {
      router.push("/body-map");
      return;
    }

    router.push("/visit-reason");
  }

  function handleContinueWithCaution() {
    saveIntake();
    router.push(pendingRoute);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/40 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <FlowStepper currentStep="intake" />
        {referralId ? (
          <section className="mb-6 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 text-teal-950 shadow-lg shadow-teal-100/60">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-teal-700">
                  Continuing your case from Salamax Family
                </p>
                <h2 className="mt-2 text-xl font-bold text-blue-950">
                  ادامه پرونده از سلامکس خانواده
                </h2>
              </div>
              <div className="max-w-2xl text-sm leading-7 text-slate-700">
                <p>
                  The initial symptoms and triage summary have been received for
                  this case.
                </p>
                <p className="mt-1">
                  شرح اولیه و خلاصه تریاژ این مورد دریافت شده و در ادامه مسیر
                  استفاده می‌شود.
                </p>
              </div>
            </div>

            {isReferralLoading && (
              <p className="mt-4 rounded-2xl border border-teal-100 bg-white/80 px-4 py-3 text-sm text-teal-800">
                در حال دریافت اطلاعات ارجاع از سلامکس خانواده...
              </p>
            )}

            {referralError && (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                {referralError}
              </p>
            )}

            {referralPayload && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 md:grid-cols-2">
                <p>
                  <span className="font-bold text-blue-950">عضو خانواده: </span>
                  {referralPayload.memberName || "ثبت نشده"}
                </p>
                <p>
                  <span className="font-bold text-blue-950">
                    فوریت پیشنهادی:{" "}
                  </span>
                  {referralPayload.urgency || "ثبت نشده"}
                </p>
                <p className="md:col-span-2">
                  <span className="font-bold text-blue-950">
                    شرح اولیه:{" "}
                  </span>
                  {referralPayload.symptomsText}
                </p>
                <p className="md:col-span-2">
                  <span className="font-bold text-blue-950">
                    تخصص پیشنهادی:{" "}
                  </span>
                  {referralPayload.suggestedSpecialty || "ثبت نشده"}
                </p>
              </div>
            )}
          </section>
        ) : isFamilyHandoff ? (
          <section className="mb-6 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 text-teal-950 shadow-lg shadow-teal-100/60">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-teal-700">
                  Continuing from Salamax Family
                </p>
                <h2 className="mt-2 text-xl font-bold text-blue-950">
                  ادامه از سلامکس خانواده
                </h2>
              </div>
              <div className="max-w-2xl text-sm leading-7 text-slate-700">
                <p>
                  This case was started in Salamax Family. We’ll help you
                  complete the full triage and booking flow.
                </p>
                <p className="mt-1">
                  این مورد از اپ سلامکس خانواده وارد شده. حالا مسیر کامل تریاژ
                  و نوبت‌دهی را ادامه می‌دهیم.
                </p>
              </div>
            </div>
          </section>
        ) : null}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
              Health AI Router
            </span>
            <h1 className="mt-4 text-3xl font-bold text-blue-950">
              پیش‌ویزیت هوشمند
            </h1>

            <p className="mt-3 max-w-2xl leading-8 text-gray-600">
              ابتدا دلیل مراجعه یا شرح حال خود را بنویسید تا سامانه مسیر مناسب
              را پیشنهاد دهد.{" "}
              دلیل مراجعه یا مشکل اصلی خود را بنویسید تا سامانه مسیر مناسب را
              انتخاب کند. اگر درد یا ناراحتی موضعی داشته باشید، وارد نقشه بدن
              می‌شوید؛ در غیر این صورت دلیل مراجعه را دقیق‌تر انتخاب می‌کنید.
            </p>
          </div>

          <div className="rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-900">
            مسیر فعلی:{" "}
            <span className="font-bold">{getFlowLabel(lastDetectedFlow)}</span>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <label className="block text-right text-sm font-medium text-gray-700">
            شرح حال اولیه یا دلیل مراجعه
          </label>

          <textarea
            value={chiefComplaint}
            onChange={(event) => {
              setChiefComplaint(event.target.value);
              setValidationError("");
              setEmergencyDetected(false);
            }}
            className="mt-3 h-44 w-full rounded-2xl border border-slate-200 bg-white p-4 text-right leading-8 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            placeholder="مثلاً: درد زانو دارم، یا می‌خواهم برای چکاپ عمومی نوبت بگیرم..."
            dir="rtl"
          />

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">{characterCount} کاراکتر</span>
            {validationError && (
              <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                {validationError}
              </span>
            )}
          </div>
          {!chiefComplaint.trim() && !validationError && (
            <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              مثال‌ها: «درد زانو دارم»، «چکاپ عمومی می‌خوام»، «برای تمدید نسخه
              مراجعه می‌کنم».
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "درد زانو دارم",
              "می‌خواهم جواب آزمایش را بررسی کنم",
              "چکاپ عمومی می‌خواهم",
              "تمدید نسخه می‌خواهم",
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setChiefComplaint(example);
                  setValidationError("");
                  setEmergencyDetected(false);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {emergencyDetected && (
          <div className="mt-6 rounded-3xl border border-red-300 bg-red-50 p-6 text-red-950 shadow-sm">
            <h2 className="text-xl font-bold">هشدار علائم خطر</h2>
            <p className="mt-3 leading-8">
              اگر علائم شدید یا خطرناک دارید، منتظر ادامه فرآیند سامانه نمانید
              و فوراً با اورژانس تماس بگیرید.
            </p>
            <p className="mt-3 text-sm leading-7 text-red-800">
              این هشدار برای احتیاط است؛ اگر مطمئن هستید که شرایط اضطراری ندارید
              می‌توانید مسیر آزمایشی را با مسئولیت خودتان ادامه دهید.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleContinueWithCaution}
                className="rounded-2xl bg-red-700 px-6 py-3 text-center text-white shadow-sm hover:bg-red-800 sm:w-auto"
              >
                ادامه با مسئولیت خودم
              </button>

              <button
                type="button"
                onClick={() => setEmergencyDetected(false)}
                className="rounded-2xl border border-red-300 px-6 py-3 text-red-700 hover:bg-red-100 sm:w-auto"
              >
                توقف و تماس با اورژانس
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
            <h3 className="font-bold text-blue-900">درد یا ناراحتی موضعی</h3>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              مسیر نقشه بدن برای انتخاب محل درد و شدت آن.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
            <h3 className="font-bold text-blue-900">مراجعه عمومی</h3>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              چکاپ، آزمایش، نسخه، مشاوره، پیگیری یا پرسش دارویی.
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h3 className="font-bold text-red-900">علائم هشدار</h3>
            <p className="mt-2 text-sm leading-7 text-red-800">
              در علائم شدید، تماس با اورژانس بر ادامه سامانه مقدم است.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-blue-950 px-6 py-3 text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-900 sm:w-auto"
          >
            ادامه
          </button>
        </div>
      </div>
      </div>
    </main>
  );
}

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/40 px-4 py-8 sm:px-6 sm:py-10" />
      }
    >
      <IntakePageContent />
    </Suspense>
  );
}
