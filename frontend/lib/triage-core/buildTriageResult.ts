import { emergencyKeywords, findMatchedKeywords } from "./keywords";
import { getSuggestedSpecialty } from "./specialtyRouting";
import type { BuildTriageInput, RiskLevel, TriageResult, Urgency } from "./types";

const safetyNotice =
  "این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی اولیه و هدایت مسیر مراجعه طراحی شده است.";

function getRiskLabel(riskLevel: RiskLevel, locale = "fa") {
  if (locale === "en") {
    const labels: Record<RiskLevel, string> = {
      green: "green",
      yellow: "yellow",
      orange: "orange",
      red: "red",
    };
    return labels[riskLevel];
  }

  const labels: Record<RiskLevel, string> = {
    green: "سبز",
    yellow: "زرد",
    orange: "نارنجی",
    red: "قرمز",
  };
  return labels[riskLevel];
}

function getPainRisk(painLevel?: number): {
  riskLevel: RiskLevel;
  urgency: Urgency;
} {
  const normalizedPainLevel =
    typeof painLevel === "number" && Number.isFinite(painLevel)
      ? Math.min(10, Math.max(1, painLevel))
      : 5;

  if (normalizedPainLevel <= 3) {
    return { riskLevel: "green", urgency: "routine" };
  }
  if (normalizedPainLevel <= 6) {
    return { riskLevel: "yellow", urgency: "soon" };
  }
  if (normalizedPainLevel <= 8) {
    return { riskLevel: "orange", urgency: "today" };
  }
  return { riskLevel: "red", urgency: "urgent" };
}

function getPainVisitRecommendation(urgency: Urgency) {
  if (urgency === "routine") {
    return "مراجعه معمولی در صورت ادامه علائم";
  }
  if (urgency === "soon") return "مراجعه طی ۲۴ تا ۴۸ ساعت";
  if (urgency === "today") return "مراجعه در اولین فرصت، ترجیحاً امروز";
  return "بررسی فوری یا تماس با اورژانس در صورت وجود علائم خطر";
}

function isYellowGeneralReason(reason?: string) {
  return (
    reason === "بررسی جواب آزمایش" ||
    reason === "مشاوره تخصصی" ||
    reason === "پیگیری بیماری قبلی"
  );
}

function getGeneralRisk(reason?: string): {
  riskLevel: RiskLevel;
  urgency: Urgency;
} {
  if (isYellowGeneralReason(reason)) {
    return { riskLevel: "yellow", urgency: "soon" };
  }

  return { riskLevel: "green", urgency: "routine" };
}

function getGeneralRecommendation(urgency: Urgency) {
  if (urgency === "soon") {
    return "مراجعه برنامه‌ریزی‌شده در زمان مناسب";
  }

  return "مراجعه معمولی و قابل برنامه‌ریزی";
}

function getMatchedRedFlags(input: BuildTriageInput) {
  const explicitMatches = input.intake.emergencyKeywordsMatched ?? [];
  const textMatches = findMatchedKeywords(
    [
      input.intake.chiefComplaint,
      input.bodyMap?.description,
      input.bodyMap?.selectedLabel,
      input.visitReason?.reason,
    ]
      .filter(Boolean)
      .join(" "),
    emergencyKeywords
  );

  return Array.from(new Set([...explicitMatches, ...textMatches]));
}

function buildDoctorSummary(input: {
  chiefComplaint: string;
  selectedLabel?: string;
  painLevel?: number;
  description?: string;
  visitReason?: string;
  riskLabel: string;
  suggestedSpecialty: string;
  emergencyOverride: boolean;
}) {
  if (input.emergencyOverride) {
    return `شرح اولیه بیمار: ${input.chiefComplaint || "ثبت نشده"}. سامانه علائم هشدار را در متن اولیه تشخیص داده است و مسیر باید با احتیاط و اولویت اورژانسی بررسی شود.`;
  }

  if (input.selectedLabel || typeof input.painLevel === "number") {
    return `شرح اولیه بیمار: ${input.chiefComplaint || "ثبت نشده"}. بیمار ${input.selectedLabel || "محل درد نامشخص"} را به عنوان محل درد یا ناراحتی ثبت کرده است. شدت درد ${input.painLevel ?? "نامشخص"} از ۱۰ ثبت شده است. توضیح بیمار: ${input.description || "توضیحی ثبت نشده است"}. درجه هشدار ${input.riskLabel} و تخصص پیشنهادی ${input.suggestedSpecialty} است.`;
  }

  return `شرح اولیه بیمار: ${input.chiefComplaint || "ثبت نشده"}. دلیل مراجعه انتخاب‌شده: ${input.visitReason || "سایر موارد"}. در این مسیر درد موضعی ثبت نشده و نقشه بدن لازم نبوده است. درجه هشدار ${input.riskLabel} و تخصص پیشنهادی ${input.suggestedSpecialty} است.`;
}

export function buildTriageResult(input: BuildTriageInput): TriageResult {
  const locale = input.locale ?? "fa";
  const matchedRedFlags = getMatchedRedFlags(input);
  const emergencyOverride =
    input.intake.detectedFlow === "emergency_flow" ||
    matchedRedFlags.length > 0;

  if (emergencyOverride) {
    const riskLevel: RiskLevel = "red";
    const urgency: Urgency = "urgent";
    const riskLabel = getRiskLabel(riskLevel, locale);
    const suggestedSpecialty = "اورژانس / پزشک عمومی";

    return {
      risk_label: riskLabel,
      risk_level: riskLevel,
      urgency,
      visit_recommendation: "تماس فوری با اورژانس یا مراجعه فوری",
      suggested_specialty: suggestedSpecialty,
      doctor_summary: buildDoctorSummary({
        chiefComplaint: input.intake.chiefComplaint,
        riskLabel,
        suggestedSpecialty,
        emergencyOverride: true,
      }),
      safety_notice: safetyNotice,
      emergency_override: true,
      matched_red_flags: matchedRedFlags,
    };
  }

  if (input.bodyMap) {
    const { riskLevel, urgency } = getPainRisk(input.bodyMap.painLevel);
    const riskLabel = getRiskLabel(riskLevel, locale);
    const suggestedSpecialty = getSuggestedSpecialty({
      bodyMap: input.bodyMap,
      chiefComplaint: input.intake.chiefComplaint,
    });

    return {
      risk_label: riskLabel,
      risk_level: riskLevel,
      urgency,
      visit_recommendation: getPainVisitRecommendation(urgency),
      suggested_specialty: suggestedSpecialty,
      doctor_summary: buildDoctorSummary({
        chiefComplaint: input.intake.chiefComplaint,
        selectedLabel: input.bodyMap.selectedLabel,
        painLevel: input.bodyMap.painLevel,
        description: input.bodyMap.description,
        riskLabel,
        suggestedSpecialty,
        emergencyOverride: false,
      }),
      safety_notice: safetyNotice,
      emergency_override: false,
      matched_red_flags: [],
    };
  }

  const reason = input.visitReason?.reason || "سایر موارد";
  const { riskLevel, urgency } = getGeneralRisk(reason);
  const riskLabel = getRiskLabel(riskLevel, locale);
  const suggestedSpecialty = getSuggestedSpecialty({
    visitReason: input.visitReason,
    chiefComplaint: input.intake.chiefComplaint,
  });

  return {
    risk_label: riskLabel,
    risk_level: riskLevel,
    urgency,
    visit_recommendation: getGeneralRecommendation(urgency),
    suggested_specialty: suggestedSpecialty,
    doctor_summary: buildDoctorSummary({
      chiefComplaint:
        input.intake.chiefComplaint ||
        input.visitReason?.chiefComplaint ||
        "ثبت نشده",
      visitReason: reason,
      riskLabel,
      suggestedSpecialty,
      emergencyOverride: false,
    }),
    safety_notice: safetyNotice,
    emergency_override: false,
    matched_red_flags: [],
  };
}
