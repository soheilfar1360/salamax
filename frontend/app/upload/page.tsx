"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FlowStepper from "@/components/FlowStepper";

type BodyMapData = {
  viewMode: "front" | "back";
  selectedRegion: string | null;
  selectedLabel: string;
  painLevel: number;
  description: string;
  savedAt: string;
};

type UploadedFileInfo = {
  name: string;
  size: number;
  type: string;
};

type IntakeData = {
  chiefComplaint: string;
  detectedFlow:
    | "pain_flow"
    | "general_visit_flow"
    | "emergency_flow"
    | "veterinary_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
  profileType?: "human" | "pet";
  suggestedSpecialty?: string;
  createdAt: string;
};

type VisitReasonData = {
  reason: string;
  chiefComplaint: string;
  requiresBodyMap: false;
  createdAt: string;
};

type DocumentAnalysis = {
  documentType: string;
  detectedLanguage: string;
  extractedTextSummary: string;
  abnormalFindings: Array<{
    name: string;
    value: string;
    referenceRange?: string;
    status: "low" | "high" | "normal" | "unknown";
    note: string;
  }>;
  plainLanguageSummary: string;
  doctorFacingSummary: string;
  triageImpact: string;
  recommendedSpecialtyHint: string;
  confidence: "low" | "medium" | "high";
  safetyDisclaimer: string;
  isMock?: boolean;
  fileName?: string;
};

function safeReadStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFlowLabel(flow?: IntakeData["detectedFlow"]) {
  if (flow === "pain_flow") return "درد یا ناراحتی موضعی";
  if (flow === "emergency_flow") return "علائم هشدار";
  if (flow === "veterinary_flow") return "مسیر دامپزشکی";
  return "مراجعه عمومی";
}

function getBackHref(
  bodyMapData: BodyMapData | null,
  visitReasonData: VisitReasonData | null,
  intakeData: IntakeData | null
) {
  if (bodyMapData) return "/body-map";
  if (visitReasonData) return "/visit-reason";
  if (intakeData?.detectedFlow === "emergency_flow") return "/intake";
  return "/intake";
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] ?? "");
    };

    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [bodyMapData, setBodyMapData] = useState<BodyMapData | null>(null);
  const [visitReasonData, setVisitReasonData] =
    useState<VisitReasonData | null>(null);
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentAnalyses, setDocumentAnalyses] = useState<DocumentAnalysis[]>(
    []
  );
  const [isAnalyzingDocuments, setIsAnalyzingDocuments] = useState(false);
  const [documentAnalysisError, setDocumentAnalysisError] = useState("");

  useEffect(() => {
    setIntakeData(safeReadStorage<IntakeData>("salamax_intake"));
    setBodyMapData(safeReadStorage<BodyMapData>("salamax_body_map"));
    setVisitReasonData(
      safeReadStorage<VisitReasonData>("salamax_visit_reason")
    );
    setDocumentAnalyses(
      safeReadStorage<DocumentAnalysis[]>("salamax_document_analyses") ?? []
    );
    setIsHydrated(true);
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    const fileInfo = selectedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "unknown",
    }));

    setFiles(fileInfo);
    setSelectedFiles(selectedFiles);
    setDocumentAnalyses([]);
    setDocumentAnalysisError("");
    localStorage.removeItem("salamax_document_analyses");
  }

  async function handleAnalyzeDocuments() {
    if (!selectedFiles.length) {
      setDocumentAnalysisError("برای تحلیل مدارک، ابتدا یک فایل انتخاب کنید.");
      return;
    }

    try {
      setIsAnalyzingDocuments(true);
      setDocumentAnalysisError("");

      const analyses = await Promise.all(
        selectedFiles.map(async (file) => {
          const fileBase64 = await fileToBase64(file);

          const response = await fetch("/.netlify/functions/analyze-document", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
              fileBase64,
              chiefComplaint: intakeData?.chiefComplaint,
              selectedRegion: bodyMapData?.selectedRegion ?? null,
              selectedLabel: bodyMapData?.selectedLabel ?? null,
              painLevel: bodyMapData?.painLevel ?? null,
              visitReason: visitReasonData?.reason ?? null,
            }),
          });

          if (!response.ok) {
            throw new Error("Document Agent request failed.");
          }

          const analysis = (await response.json()) as DocumentAnalysis;

          return {
            ...analysis,
            fileName: file.name,
          };
        })
      );

      setDocumentAnalyses(analyses);
      localStorage.setItem(
        "salamax_document_analyses",
        JSON.stringify(analyses)
      );
    } catch {
      setDocumentAnalysisError(
        "تحلیل مدارک انجام نشد. می‌توانید بدون تحلیل مدارک ادامه دهید."
      );
    } finally {
      setIsAnalyzingDocuments(false);
    }
  }

  function handleContinue() {
    localStorage.setItem("salamax_uploaded_files", JSON.stringify(files));
    router.push("/results");
  }

  return (
    <main className="min-h-screen bg-[#F6FBFC] px-4 py-8 text-[#183B56] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <FlowStepper currentStep="documents" />

        {!isHydrated ? (
          <div className="mt-8 rounded-3xl border border-[#D7ECEF] bg-white p-8 text-center shadow-sm">
            <p className="text-[#64748B]">در حال بارگذاری اطلاعات...</p>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-[#D7ECEF] bg-white p-6 shadow-sm sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#20C9C3] bg-[#EAFBF8] px-4 py-2 text-sm font-bold text-[#0E8F8A]">
              مدارک و Document Agent
            </span>

            <h1 className="mt-4 text-3xl font-bold text-[#102A43]">
              آپلود مدارک پزشکی
            </h1>

            <p className="mt-3 leading-8 text-[#64748B]">
              اگر آزمایش، نسخه، عکس دارو، گزارش تصویربرداری یا هر مدرک پزشکی
              مرتبط دارید، می‌توانید در این مرحله بارگذاری کنید. این بخش اختیاری
              است. این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای
              راهنمایی اولیه و هدایت مسیر مراجعه طراحی شده است.
            </p>

            {intakeData && (
              <section className="mt-6 rounded-2xl border border-[#D7ECEF] bg-[#EAFBF8] p-5 text-[#183B56]">
                <h2 className="font-bold text-[#102A43]">شرح اولیه مراجعه</h2>

                <div className="mt-3 space-y-2 text-sm leading-7">
                  <p>
                    <span className="font-bold">شرح کاربر:</span>{" "}
                    {intakeData.chiefComplaint}
                  </p>

                  <p>
                    <span className="font-bold">مسیر تشخیص‌داده‌شده:</span>{" "}
                    {getFlowLabel(intakeData.detectedFlow)}
                  </p>
                </div>
              </section>
            )}

            {bodyMapData && (
              <section className="mt-6 rounded-2xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
                <h2 className="font-bold text-[#102A43]">
                  خلاصه انتخاب محل درد
                </h2>

                <div className="mt-3 space-y-2 text-sm leading-7">
                  <p>
                    <span className="font-bold">ناحیه انتخاب‌شده:</span>{" "}
                    {bodyMapData.selectedLabel}
                  </p>

                  <p>
                    <span className="font-bold">شدت درد:</span>{" "}
                    {bodyMapData.painLevel} از ۱۰
                  </p>

                  <p>
                    <span className="font-bold">نمای انتخابی:</span>{" "}
                    {bodyMapData.viewMode === "front" ? "جلو" : "پشت"}
                  </p>

                  {bodyMapData.description && (
                    <p>
                      <span className="font-bold">توضیح:</span>{" "}
                      {bodyMapData.description}
                    </p>
                  )}
                </div>
              </section>
            )}

            {visitReasonData && (
              <section className="mt-6 rounded-2xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
                <h2 className="font-bold text-[#102A43]">
                  دلیل مراجعه انتخاب‌شده
                </h2>

                <div className="mt-3 space-y-2 text-sm leading-7">
                  <p>
                    <span className="font-bold">دلیل مراجعه:</span>{" "}
                    {visitReasonData.reason}
                  </p>

                  <p>
                    <span className="font-bold">نیاز به نقشه بدن:</span> ندارد
                  </p>
                </div>
              </section>
            )}

            {intakeData?.detectedFlow === "emergency_flow" && (
              <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
                <h2 className="font-bold">یادآوری علائم خطر</h2>

                <p className="mt-2 text-sm leading-7">
                  اگر علائم شدید یا خطرناک دارید، منتظر ادامه فرآیند سامانه
                  نمانید و فوراً با اورژانس تماس بگیرید.
                </p>
              </section>
            )}

            <div className="mt-8 rounded-3xl border border-dashed border-[#20C9C3] bg-[#EAFBF8] p-8 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#20C9C3] bg-white text-lg font-bold text-[#0E8F8A]">
                PDF
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#102A43]">
                فایل‌های پزشکی خود را انتخاب کنید
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                فرمت‌های پیشنهادی: PDF، JPG، PNG
              </p>

              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="mt-6 block w-full cursor-pointer rounded-2xl border border-[#D7ECEF] bg-white p-3 text-sm text-[#183B56] shadow-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#20C9C3] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#061923]"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-6 rounded-2xl border border-[#D7ECEF] bg-white p-5 shadow-sm">
                <h2 className="font-bold text-[#102A43]">
                  فایل‌های انتخاب‌شده
                </h2>

                <div className="mt-4 space-y-3">
                  {files.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex flex-col gap-1 rounded-2xl border border-[#D7ECEF] bg-[#F6FBFC] p-4 text-sm text-[#183B56] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium">{file.name}</span>
                      <span className="text-[#64748B]">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleAnalyzeDocuments}
                    disabled={isAnalyzingDocuments}
                    className={`rounded-xl px-6 py-3 text-center font-bold transition ${
                      isAnalyzingDocuments
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-[#20C9C3] text-[#061923] shadow-sm hover:bg-[#0E8F8A] hover:text-white"
                    }`}
                  >
                    {isAnalyzingDocuments
                      ? "در حال تحلیل مدارک..."
                      : "تحلیل مدارک با Document Agent"}
                  </button>

                  <p className="text-sm leading-7 text-[#64748B]">
                    تحلیل مدارک اختیاری است و مسیر ادامه را مسدود نمی‌کند.
                  </p>
                </div>
              </div>
            )}

            {documentAnalysisError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                {documentAnalysisError}
              </div>
            )}

            {documentAnalyses.length > 0 && (
              <section className="mt-6 rounded-2xl border border-[#D7ECEF] bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-[#102A43]">
                  نتایج Document Agent
                </h2>

                <div className="mt-5 grid gap-4">
                  {documentAnalyses.map((analysis, index) => (
                    <article
                      key={`${
                        analysis.fileName ?? analysis.documentType
                      }-${index}`}
                      className="rounded-2xl border border-[#D7ECEF] bg-[#F6FBFC] p-5"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-bold text-[#102A43]">
                            {analysis.fileName ?? `مدرک ${index + 1}`}
                          </h3>

                          <p className="mt-1 text-sm text-[#64748B]">
                            نوع مدرک: {analysis.documentType} · زبان:{" "}
                            {analysis.detectedLanguage}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {analysis.isMock && (
                            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-bold text-yellow-800">
                              Mock Analysis
                            </span>
                          )}

                          <span className="rounded-full border border-[#20C9C3] bg-[#EAFBF8] px-4 py-2 text-sm font-bold text-[#0E8F8A]">
                            میزان اطمینان: {analysis.confidence}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 leading-8 text-[#183B56]">
                        <p>
                          <span className="font-bold text-[#0E8F8A]">
                            خلاصه:
                          </span>{" "}
                          {analysis.plainLanguageSummary}
                        </p>

                        <p>
                          <span className="font-bold text-[#0E8F8A]">
                            اثر احتمالی روی تریاژ:
                          </span>{" "}
                          {analysis.triageImpact}
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#D7ECEF] bg-white p-4">
                        <h4 className="font-bold text-[#102A43]">
                          موارد غیرعادی
                        </h4>

                        {analysis.abnormalFindings.length > 0 ? (
                          <div className="mt-3 grid gap-3">
                            {analysis.abnormalFindings.map((finding) => (
                              <div
                                key={`${finding.name}-${finding.value}`}
                                className="rounded-xl border border-[#D7ECEF] bg-[#F6FBFC] p-3 text-sm text-[#183B56]"
                              >
                                <p className="font-bold">
                                  {finding.name}: {finding.value}
                                </p>

                                <p className="mt-1">
                                  وضعیت: {finding.status}
                                  {finding.referenceRange
                                    ? ` · محدوده مرجع: ${finding.referenceRange}`
                                    : ""}
                                </p>

                                <p className="mt-1 text-[#64748B]">
                                  {finding.note}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-7 text-[#64748B]">
                            مورد غیرعادی مشخصی از روی محدوده‌های مرجع قابل
                            مشاهده گزارش نشده است.
                          </p>
                        )}
                      </div>

                      <p className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm leading-7 text-yellow-900">
                        <span className="font-bold">هشدار:</span> این تحلیل
                        جایگزین پزشک نیست. {analysis.safetyDisclaimer}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
                <h3 className="font-bold text-[#102A43]">آزمایش‌ها</h3>
                <p className="mt-2 text-sm text-[#64748B]">
                  CBC، قند خون، چربی، تیروئید و سایر نتایج آزمایشگاهی
                </p>
              </div>

              <div className="rounded-2xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
                <h3 className="font-bold text-[#102A43]">نسخه‌ها و داروها</h3>
                <p className="mt-2 text-sm text-[#64748B]">
                  نسخه‌های قبلی، عکس داروها یا لیست داروهای مصرفی
                </p>
              </div>

              <div className="rounded-2xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
                <h3 className="font-bold text-[#102A43]">تصویربرداری</h3>
                <p className="mt-2 text-sm text-[#64748B]">
                  گزارش MRI، CT Scan، سونوگرافی یا رادیولوژی
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-[#20C9C3] bg-[#EAFBF8] p-5 text-[#183B56]">
              <h3 className="font-bold text-[#102A43]">
                نکته مهم درباره حریم خصوصی
              </h3>

              <p className="mt-2 text-sm leading-7 text-[#64748B]">
                در این نسخه sandbox، محتوای فایل‌ها به سرور ارسال نمی‌شود و فقط
                نام، نوع و حجم فایل برای شبیه‌سازی مسیر در مرورگر نگهداری
                می‌شود. در نسخه عملیاتی، مدارک پزشکی باید رمزگذاری شده و فقط با
                رضایت کاربر برای پزشک یا سرویس مجاز ارسال شوند.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full rounded-2xl bg-[#20C9C3] px-6 py-3 text-center font-bold text-[#061923] shadow-sm transition hover:bg-[#0E8F8A] hover:text-white sm:w-auto"
              >
                ادامه و تحلیل اولیه
              </button>

              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  localStorage.setItem(
                    "salamax_uploaded_files",
                    JSON.stringify([])
                  );
                  router.push("/results");
                }}
                className="w-full rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] transition hover:bg-[#EAFBF8] sm:w-auto"
              >
                مدرکی ندارم، ادامه بده
              </button>

              <Link
                href={getBackHref(bodyMapData, visitReasonData, intakeData)}
                className="w-full rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] transition hover:bg-[#EAFBF8] sm:w-auto"
              >
                بازگشت
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}