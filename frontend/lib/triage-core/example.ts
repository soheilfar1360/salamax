import { buildTriageResult, classifyIntake } from "./index";
import type { BodyMapInput, VisitReasonInput } from "./types";

function runExample(
  title: string,
  chiefComplaint: string,
  options?: {
    bodyMap?: BodyMapInput | null;
    visitReason?: VisitReasonInput | null;
  }
) {
  const intake = classifyIntake(chiefComplaint);
  const triage = buildTriageResult({
    intake,
    bodyMap: options?.bodyMap,
    visitReason: options?.visitReason,
  });

  console.log(title, {
    input: {
      chiefComplaint,
      bodyMap: options?.bodyMap ?? null,
      visitReason: options?.visitReason ?? null,
    },
    intake,
    triage,
  });
}

runExample("1. Mild pain", "mild knee pain", {
  bodyMap: {
    painLevel: 2,
    selectedLabel: "knee pain",
    selectedRegion: "left-knee",
    description: "Pain after walking.",
  },
});

runExample("2. Moderate pain", "درد کمر دارم", {
  bodyMap: {
    painLevel: 5,
    selectedLabel: "کمر",
    selectedRegion: "lower-back",
    description: "درد هنگام نشستن بیشتر می‌شود.",
  },
});

runExample("3. Severe pain", "severe arm pain", {
  bodyMap: {
    painLevel: 9,
    selectedLabel: "arm pain",
    selectedRegion: "left-arm",
  },
});

runExample("4. Emergency chest pain", "severe chest pain and sweating");

runExample("5. General lab review", "می‌خواهم جواب آزمایش را بررسی کنم", {
  visitReason: {
    reason: "بررسی جواب آزمایش",
    chiefComplaint: "می‌خواهم جواب آزمایش را بررسی کنم",
    requiresBodyMap: false,
  },
});

runExample("6. Persian emergency phrase", "تنگی نفس دارم");

/*
Expected shape for each triage output:
{
  risk_label: string,
  risk_level: "green" | "yellow" | "orange" | "red",
  urgency: "routine" | "soon" | "today" | "urgent",
  visit_recommendation: string,
  suggested_specialty: string,
  doctor_summary: string,
  safety_notice: string,
  emergency_override: boolean,
  matched_red_flags: string[]
}
*/
