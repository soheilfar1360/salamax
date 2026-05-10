export const painKeywords = [
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

export const generalVisitKeywords = [
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

export const emergencyKeywords = [
  "severe chest pain",
  "shortness of breath",
  "fainting",
  "loss of consciousness",
  "severe bleeding",
  "sudden weakness",
  "one-sided numbness",
  "stroke",
  "seizure",
  "درد شدید قفسه سینه",
  "درد قفسه سینه",
  "تنگی نفس",
  "بیهوشی",
  "غش",
  "خونریزی شدید",
  "ضعف ناگهانی",
  "بی‌حسی یک طرف بدن",
  "بی حسی یک طرف بدن",
  "بی‌حسی یک طرفه",
  "بی حسی یک طرفه",
  "سکته",
  "تشنج",
];

export function normalizeForKeywordMatch(text: string) {
  return text.trim().toLowerCase();
}

export function findMatchedKeywords(text: string, keywords: string[]) {
  const normalized = normalizeForKeywordMatch(text);

  return keywords.filter((keyword) =>
    normalized.includes(normalizeForKeywordMatch(keyword))
  );
}

export function includesAnyKeyword(text: string, keywords: string[]) {
  return findMatchedKeywords(text, keywords).length > 0;
}
