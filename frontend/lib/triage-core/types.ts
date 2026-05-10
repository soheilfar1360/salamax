export type DetectedFlow =
  | "pain_flow"
  | "general_visit_flow"
  | "emergency_flow";

export type RiskLevel = "green" | "yellow" | "orange" | "red";

export type Urgency = "routine" | "soon" | "today" | "urgent";

export type Locale = "fa" | "en";

export type IntakeClassification = {
  chiefComplaint: string;
  detectedFlow: DetectedFlow;
  hasPain: boolean;
  requiresBodyMap: boolean;
  emergencyKeywordsMatched: string[];
};

export type TriageIntakeInput = {
  chiefComplaint: string;
  detectedFlow: DetectedFlow;
  hasPain: boolean;
  requiresBodyMap: boolean;
  emergencyKeywordsMatched?: string[];
};

export type PainMarkerInput = {
  id?: string;
  viewMode?: "front" | "back";
  xPercent?: number;
  yPercent?: number;
  label?: string;
};

export type BodyMapInput = {
  viewMode?: "front" | "back";
  painMarkers?: PainMarkerInput[];
  painLevel?: number;
  description?: string;
  selectedLabel?: string;
  selectedRegion?: string | null;
};

export type VisitReasonInput = {
  reason?: string;
  chiefComplaint?: string;
  requiresBodyMap?: boolean;
};

export type BuildTriageInput = {
  intake: TriageIntakeInput;
  bodyMap?: BodyMapInput | null;
  visitReason?: VisitReasonInput | null;
  locale?: Locale;
};

export type TriageResult = {
  risk_label: string;
  risk_level: RiskLevel;
  urgency: Urgency;
  visit_recommendation: string;
  suggested_specialty: string;
  doctor_summary: string;
  safety_notice: string;
  emergency_override: boolean;
  matched_red_flags: string[];
};
