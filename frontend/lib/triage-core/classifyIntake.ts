import {
  emergencyKeywords,
  findMatchedKeywords,
  generalVisitKeywords,
  includesAnyKeyword,
  painKeywords,
} from "./keywords";
import type { IntakeClassification } from "./types";

export function classifyIntake(chiefComplaint: string): IntakeClassification {
  const trimmedComplaint = chiefComplaint.trim();
  const emergencyKeywordsMatched = findMatchedKeywords(
    trimmedComplaint,
    emergencyKeywords
  );
  const hasPain = includesAnyKeyword(trimmedComplaint, painKeywords);
  const hasGeneralVisitReason = includesAnyKeyword(
    trimmedComplaint,
    generalVisitKeywords
  );

  if (emergencyKeywordsMatched.length > 0) {
    return {
      chiefComplaint: trimmedComplaint,
      detectedFlow: "emergency_flow",
      hasPain,
      requiresBodyMap: hasPain,
      emergencyKeywordsMatched,
    };
  }

  if (hasPain) {
    return {
      chiefComplaint: trimmedComplaint,
      detectedFlow: "pain_flow",
      hasPain: true,
      requiresBodyMap: true,
      emergencyKeywordsMatched: [],
    };
  }

  return {
    chiefComplaint: trimmedComplaint,
    detectedFlow: hasGeneralVisitReason
      ? "general_visit_flow"
      : "general_visit_flow",
    hasPain: false,
    requiresBodyMap: false,
    emergencyKeywordsMatched: [],
  };
}
