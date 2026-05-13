"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlowStepper from "@/components/FlowStepper";

type DetectedFlow =
  | "pain_flow"
  | "general_visit_flow"
  | "emergency_flow"
  | "veterinary_flow";

type IntakeReferralPayload = {
  profileType?: "human" | "pet";
  memberName?: string;
  age?: number;
  relation?: string;
  symptomsText?: string;
  severity?: string;
  urgency?: string;
  suggestedSpecialty?: string;
  doctorSummary?: string;
  petType?: string;
  breed?: string;
  weightKg?: string;
  vetName?: string;
  vetPhone?: string;
  vaccinationStatus?: string;
  petNotes?: string;
};

type ReferralLookupResponse = {
  referralId: string;
  payload?: IntakeReferralPayload;
};

const REFERRAL_API_BASE =
  "https://salamax-referral-api.soheil-f.workers.dev";

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
  if (flow === "veterinary_flow") return "مسیر دامپزشکی / Veterinary care path";
  return "مسیر مراجعه عمومی";
}

function hasPetReferralSignal(payload: IntakeReferralPayload | null) {
  if (!payload) return false;
  const petRelations = ["سگ", "گربه", "پرنده", "خرگوش", "حیوان خانگی"];
  const suggestedSpecialty = payload.suggestedSpecialty?.trim() ?? "";
  const relation = payload.relation?.trim() ?? "";
  const doctorSummary = payload.doctorSummary?.trim() ?? "";

  return Boolean(
    payload.profileType === "pet" ||
      suggestedSpecialty === "دامپزشک" ||
      suggestedSpecialty.includes("دامپزشک") ||
      petRelations.includes(relation) ||
      doctorSummary.includes("دامپزشکی") ||
      doctorSummary.includes("دامپزشک") ||
      doctorSummary.includes("حیوان خانگی") ||
      payload.petType?.trim() ||
      payload.breed?.trim() ||
      payload.weightKg?.trim() ||
      payload.vaccinationStatus?.trim() ||
      payload.petNotes?.trim()
  );
}

function IntakePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const referralId = searchParams.get("referralId");
  const isFamilyHandoff = searchParams.get("source") === "salamax_family";
  const isFromApp =
    searchParams.get("source") === "app" ||
    searchParams.get("fromApp") === "1" ||
    searchParams.get("returnToApp") === "true";

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [validationError, setValidationError] = useState("");
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<"/body-map" | "/upload">(
    "/upload"
  );
  const [lastDetectedFlow, setLastDetectedFlow] =
    useState<DetectedFlow | null>(null);

  const [referralPayload, setReferralPayload] =
    useState<IntakeReferralPayload | null>(null);
  const [referralError, setReferralError] = useState("");
  const [isReferralLoading, setIsReferralLoading] = useState(false);

  const hasPrefilledReferralRef = useRef(false);
  const hasUserEditedChiefComplaintRef = useRef(false);
  const isPetReferral = hasPetReferralSignal(referralPayload);

  useEffect(() => {
    if (isFromApp) {
      localStorage.setItem("salamax_from_app", "true");
    }
  }, [isFromApp]);

  useEffect(() => {
    let isActive = true;

    async function loadReferral() {
      if (!referralId) {
        setReferralPayload(null);
        setReferralError("");
        setIsReferralLoading(false);
        hasPrefilledReferralRef.current = false;
        hasUserEditedChiefComplaintRef.current = false;
        return;
      }

      setReferralPayload(null);
      setReferralError("");
      setIsReferralLoading(true);
      hasPrefilledReferralRef.current = false;
      hasUserEditedChiefComplaintRef.current = false;

      try {
        const referralFetchUrl = `${REFERRAL_API_BASE}/referrals/${encodeURIComponent(
          referralId
        )}`;

        const response = await fetch(referralFetchUrl, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Referral fetch failed: ${response.status}`);
        }

        const data = (await response.json()) as ReferralLookupResponse;
        const payload = data?.payload ?? null;

        if (!isActive) return;

        setReferralPayload(payload);

        const symptomsText =
          payload?.symptomsText?.trim() || payload?.petNotes?.trim() || "";

        if (symptomsText && !hasPrefilledReferralRef.current) {
          setChiefComplaint((currentText) => {
            if (currentText.trim() || hasUserEditedChiefComplaintRef.current) {
              return currentText;
            }

            hasPrefilledReferralRef.current = true;
            return symptomsText;
          });

          setValidationError("");
        }
      } catch {
        if (!isActive) return;

        setReferralPayload(null);
        setReferralError(
          "ارجاع سلامکس خانواده پیدا نشد یا دیگر در دسترس نیست. می‌توانید مسیر عادی پیش‌ویزیت را ادامه دهید."
        );
      } finally {
        if (isActive) {
          setIsReferralLoading(false);
        }
      }
    }

    void loadReferral();

    return () => {
      isActive = false;
    };
  }, [referralId]);

  const characterCount = useMemo(
    () => chiefComplaint.trim().length,
    [chiefComplaint]
  );

  function saveIntake() {
    if (isPetReferral) {
      const petChiefComplaint =
        chiefComplaint.trim() ||
        referralPayload?.symptomsText?.trim() ||
        referralPayload?.petNotes?.trim() ||
        "پرونده حیوان خانگی";

      const intakeData = {
        chiefComplaint: petChiefComplaint,
        profileType: "pet",
        relation: referralPayload?.relation,
        petType: referralPayload?.petType,
        breed: referralPayload?.breed,
        weightKg: referralPayload?.weightKg,
        vaccinationStatus: referralPayload?.vaccinationStatus,
        petNotes: referralPayload?.petNotes,
        detectedFlow: "veterinary_flow" as const,
        hasPain: false,
        requiresBodyMap: false,
        suggestedSpecialty: "دامپزشک",
        doctorSummary: referralPayload?.doctorSummary,
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
      setLastDetectedFlow("veterinary_flow");

      return {
        detectedFlow: "veterinary_flow" as const,
        hasPain: false,
        requiresBodyMap: false,
      };
    }

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

    if (isPetReferral) {
      saveIntake();
      router.push("/results");
      return;
    }

    if (!chiefComplaint.trim()) {
      setValidationError("برای شروع، یک جمله کوتاه درباره دلیل مراجعه بنویسید.");
      return;
    }

    const classification = saveIntake();

    if (classification.detectedFlow === "veterinary_flow") {
      router.push("/results");
      return;
    }

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
    <main className="min-h-screen bg-[#F6FBFC] px-4 py-8 text-[#183B56] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <FlowStepper currentStep="intake" />

        {isFromApp && (
          <span className="mb-4 inline-flex items-center rounded-full border border-[#D7ECEF] bg-[#EAFBF8] px-4 py-2 text-sm font-bold text-[#0E8F8A]">
            ادامه از اپلیکیشن سلامکس
          </span>
        )}

        {referralId ? (
          <section className="mb-6 rounded-3xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-teal-700">
                  {isPetReferral
                    ? "Continuing a pet care case from Salamax Family"
                    : "Continuing your case from Salamax Family"}
                </p>
                <h2 className="mt-2 text-xl font-bold text-blue-950">
                  {isPetReferral && "ادامه پرونده حیوان خانگی از سلامکس خانواده"}
                  {!isPetReferral &&
                    "ادامه پرونده از سلامکس خانواده"
                  }
                </h2>
              </div>

              <div className="max-w-2xl text-sm leading-7 text-[#64748B]">
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
              <p className="mt-4 rounded-2xl border border-[#D7ECEF] bg-[#EAFBF8] px-4 py-3 text-sm text-[#0E8F8A]">
                در حال دریافت اطلاعات ارجاع از سلامکس خانواده...
              </p>
            )}

            {referralError && (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                {referralError}
              </p>
            )}

            {referralPayload && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-[#D7ECEF] bg-white p-4 text-sm text-[#183B56] md:grid-cols-2">
                <p>
                  <span className="font-bold text-blue-950">عضو خانواده: </span>
                  {referralPayload.memberName || "ثبت نشده"}
                </p>
                {isPetReferral && (
                  <>
                    <p>
                      <span className="font-bold text-blue-950">
                        نوع حیوان:{" "}
                      </span>
                      {referralPayload.petType || "ثبت نشده"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-950">نژاد: </span>
                      {referralPayload.breed || "ثبت نشده"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-950">وزن: </span>
                      {referralPayload.weightKg || "ثبت نشده"}
                    </p>
                    <p>
                      <span className="font-bold text-blue-950">
                        وضعیت واکسیناسیون:{" "}
                      </span>
                      {referralPayload.vaccinationStatus || "ثبت نشده"}
                    </p>
                    <p className="md:col-span-2">
                      <span className="font-bold text-blue-950">
                        یادداشت حیوان خانگی:{" "}
                      </span>
                      {referralPayload.petNotes || "ثبت نشده"}
                    </p>
                  </>
                )}
                <p>
                  <span className="font-bold text-blue-950">سن: </span>
                  {typeof referralPayload.age === "number"
                    ? referralPayload.age
                    : "ثبت نشده"}
                </p>
                <p>
                  <span className="font-bold text-blue-950">نسبت: </span>
                  {referralPayload.relation || "ثبت نشده"}
                </p>
                <p>
                  <span className="font-bold text-blue-950">شدت: </span>
                  {referralPayload.severity || "ثبت نشده"}
                </p>
                <p>
                  <span className="font-bold text-blue-950">
                    فوریت پیشنهادی:{" "}
                  </span>
                  {referralPayload.urgency || "ثبت نشده"}
                </p>
                <p>
                  <span className="font-bold text-blue-950">
                    تخصص پیشنهادی:{" "}
                  </span>
                  {isPetReferral
                    ? "دامپزشک"
                    : referralPayload.suggestedSpecialty || "ثبت نشده"}
                </p>
                <p className="md:col-span-2">
                  <span className="font-bold text-blue-950">
                    شرح ارسال‌شده از اپ خانواده:{" "}
                  </span>
                  {referralPayload.symptomsText || "ثبت نشده"}
                </p>
              </div>
            )}
            {isPetReferral && (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                این مسیر جایگزین معاینه دامپزشک نیست. در علائم شدید یا تغییر
                ناگهانی وضعیت حیوان، با دامپزشک یا مرکز دامپزشکی تماس بگیرید.
                This path does not replace a veterinarian. For severe symptoms
                or sudden changes, contact a veterinarian or veterinary clinic.
              </p>
            )}
          </section>
        ) : isFamilyHandoff ? (
          <section className="mb-6 rounded-3xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-teal-700">
                  Continuing from Salamax Family
                </p>
                <h2 className="mt-2 text-xl font-bold text-blue-950">
                  ادامه از سلامکس خانواده
                </h2>
              </div>

              <div className="max-w-2xl text-sm leading-7 text-[#64748B]">
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

        <div className="rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
                Health AI Router
              </span>
              <h1 className="mt-4 text-3xl font-bold text-[#102A43]">
                پیش‌ویزیت هوشمند
              </h1>

              <p className="mt-3 max-w-2xl leading-8 text-[#64748B]">
                ابتدا دلیل مراجعه یا شرح حال خود را بنویسید تا سامانه مسیر
                مناسب را پیشنهاد دهد. دلیل مراجعه یا مشکل اصلی خود را بنویسید
                تا سامانه مسیر مناسب را انتخاب کند. اگر درد یا ناراحتی موضعی
                داشته باشید، وارد نقشه بدن می‌شوید؛ در غیر این صورت دلیل
                مراجعه را دقیق‌تر انتخاب می‌کنید.
              </p>
            </div>

            <div className="rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-900">
              مسیر فعلی:{" "}
              <span className="font-bold">{getFlowLabel(lastDetectedFlow)}</span>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#D7ECEF] bg-white p-4 sm:p-5">
            <label className="block text-right text-sm font-medium text-[#102A43]">
              شرح حال اولیه یا دلیل مراجعه
            </label>

            <textarea
              value={chiefComplaint}
              onChange={(event) => {
                hasUserEditedChiefComplaintRef.current = true;
                setChiefComplaint(event.target.value);
                setValidationError("");
                setEmergencyDetected(false);
              }}
              className="mt-3 h-44 w-full rounded-2xl border border-[#D7ECEF] bg-white p-4 text-right leading-8 text-[#183B56] outline-none transition placeholder:text-[#94A3B8] focus:border-[#20C9C3] focus:ring-4 focus:ring-[#20C9C3]/15"
              placeholder="مثلاً: درد زانو دارم، یا می‌خواهم برای چکاپ عمومی نوبت بگیرم..."
              dir="rtl"
            />

            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[#64748B]">{characterCount} کاراکتر</span>
              {validationError && (
                <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                  {validationError}
                </span>
              )}
            </div>

            {!chiefComplaint.trim() && !validationError && (
              <p className="mt-3 rounded-2xl border border-[#D7ECEF] bg-[#F6FBFC] p-4 text-sm leading-7 text-[#64748B]">
                مثال‌ها: «درد زانو دارم»، «چکاپ عمومی می‌خوام»، «برای تمدید
                نسخه مراجعه می‌کنم».
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
                  hasUserEditedChiefComplaintRef.current = true;
                  setChiefComplaint(example);
                  setValidationError("");
                    setEmergencyDetected(false);
                  }}
                  className="rounded-full border border-[#D7ECEF] bg-white px-4 py-2 text-sm text-[#183B56] shadow-sm transition hover:border-[#20C9C3] hover:bg-[#EAFBF8]"
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
                اگر علائم شدید یا خطرناک دارید، منتظر ادامه فرآیند سامانه
                نمانید و فوراً با اورژانس تماس بگیرید.
              </p>
              <p className="mt-3 text-sm leading-7 text-red-800">
                این هشدار برای احتیاط است؛ اگر مطمئن هستید که شرایط اضطراری
                ندارید می‌توانید مسیر آزمایشی را با مسئولیت خودتان ادامه دهید.
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
            <div className="rounded-2xl border border-[#D7ECEF] bg-[#EAFBF8] p-5 text-[#183B56]">
              <h3 className="font-bold text-blue-900">درد یا ناراحتی موضعی</h3>
              <p className="mt-2 text-sm leading-7 text-[#64748B]">
                مسیر نقشه بدن برای انتخاب محل درد و شدت آن.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D7ECEF] bg-[#EAFBF8] p-5 text-[#183B56]">
              <h3 className="font-bold text-blue-900">مراجعه عمومی</h3>
              <p className="mt-2 text-sm leading-7 text-[#64748B]">
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
        <main className="min-h-screen bg-[#F6FBFC] px-4 py-8 text-[#183B56] sm:px-6 sm:py-10" />
      }
    >
      <IntakePageContent />
    </Suspense>
  );
}
