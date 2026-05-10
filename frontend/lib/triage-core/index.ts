export { classifyIntake } from "./classifyIntake";
export { buildTriageResult } from "./buildTriageResult";
export {
  getSpecialtyForRegion,
  getSpecialtyForVisitReason,
  getSuggestedSpecialty,
  inferRegionFromBodyMap,
  inferRegionFromText,
} from "./specialtyRouting";
export {
  emergencyKeywords,
  findMatchedKeywords,
  generalVisitKeywords,
  includesAnyKeyword,
  normalizeForKeywordMatch,
  painKeywords,
} from "./keywords";
export type {
  BodyMapInput,
  BuildTriageInput,
  DetectedFlow,
  IntakeClassification,
  Locale,
  PainMarkerInput,
  RiskLevel,
  TriageIntakeInput,
  TriageResult,
  Urgency,
  VisitReasonInput,
} from "./types";
