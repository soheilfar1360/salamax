import type { BodyMapInput, VisitReasonInput } from "./types";

const limbRegionIds = [
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
];

function containsAny(text: string, keywords: string[]) {
  const normalized = text.trim().toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function inferRegionFromText(text: string) {
  if (
    containsAny(text, [
      "chest",
      "قفسه",
      "سینه",
      "قلب",
      "قفسه سینه",
    ])
  ) {
    return "chest";
  }

  if (containsAny(text, ["abdomen", "stomach", "belly", "شکم", "معده"])) {
    return "abdomen";
  }

  if (containsAny(text, ["head", "سر", "سردرد", "مغز"])) {
    return "head";
  }

  if (containsAny(text, ["neck", "back", "گردن", "کمر", "پشت"])) {
    return "back-neck";
  }

  if (
    containsAny(text, [
      "knee",
      "leg",
      "arm",
      "shoulder",
      "hand",
      "foot",
      "زانو",
      "پا",
      "دست",
      "شانه",
      "بازو",
      "مچ",
      "ران",
      "ساق",
    ])
  ) {
    return "limb";
  }

  return null;
}

export function inferRegionFromBodyMap(
  bodyMap?: BodyMapInput | null,
  chiefComplaint = ""
) {
  if (!bodyMap) return inferRegionFromText(chiefComplaint);

  if (bodyMap.selectedRegion) return bodyMap.selectedRegion;

  const markerLabels =
    bodyMap.painMarkers
      ?.map((marker) => marker.label)
      .filter(Boolean)
      .join(" ") ?? "";

  return inferRegionFromText(
    [
      bodyMap.selectedLabel,
      bodyMap.description,
      markerLabels,
      chiefComplaint,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function getSpecialtyForRegion(region?: string | null) {
  if (region === "chest") return "قلب و عروق / داخلی";
  if (region === "abdomen") return "داخلی / گوارش";
  if (region === "head") return "مغز و اعصاب / داخلی";
  if (region === "back-neck") return "ارتوپدی / طب فیزیکی";
  if (["neck", "upper-back", "lower-back"].includes(region ?? "")) {
    return "ارتوپدی / طب فیزیکی";
  }
  if (region === "limb" || limbRegionIds.includes(region ?? "")) {
    return "ارتوپدی / طب فیزیکی";
  }

  return "پزشک عمومی / داخلی";
}

export function getSpecialtyForVisitReason(reason?: string) {
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
      return "پزشک عمومی / داخلی";
  }
}

export function getSuggestedSpecialty(input: {
  bodyMap?: BodyMapInput | null;
  visitReason?: VisitReasonInput | null;
  chiefComplaint?: string;
}) {
  if (input.bodyMap) {
    return getSpecialtyForRegion(
      inferRegionFromBodyMap(input.bodyMap, input.chiefComplaint)
    );
  }

  return getSpecialtyForVisitReason(input.visitReason?.reason);
}
