export type ReferralPayload = {
  source: "salamax_family";
  memberName: string;
  age?: number;
  relation?: string;
  symptomsText: string;
  severity?: string;
  duration?: string;
  fever?: string;
  temperature?: string;
  selectedRedFlags?: string[];
  triageLevel?: string;
  urgency?: string;
  suggestedSpecialty?: string;
  doctorSummary?: string;
  language?: "fa" | "en";
  createdAt?: string;
};

export type ReferralRecord = {
  referralId: string;
  payload: ReferralPayload;
  storedAt: string;
};
