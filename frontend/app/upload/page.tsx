"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  detectedFlow: "pain_flow" | "general_visit_flow" | "emergency_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
  createdAt: string;
};

type VisitReasonData = {
  reason: string;
  chiefComplaint: string;
  requiresBodyMap: false;
  createdAt: string;
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

export default function UploadPage() {
  const router = useRouter();

  const [intakeData] = useState<IntakeData | null>(() =>
    safeReadStorage<IntakeData>("salamax_intake")
  );
  const [bodyMapData] = useState<BodyMapData | null>(() =>
    safeReadStorage<BodyMapData>("salamax_body_map")
  );
  const [visitReasonData] = useState<VisitReasonData | null>(() =>
    safeReadStorage<VisitReasonData>("salamax_visit_reason")
  );
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    const fileInfo = selectedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "unknown",
    }));

    setFiles(fileInfo);
  }

  function handleContinue() {
    localStorage.setItem("salamax_uploaded_files", JSON.stringify(files));
    router.push("/results");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-blue-900">
          آپلود مدارک پزشکی
        </h1>

        <p className="mt-3 leading-8 text-gray-600">
          اگر آزمایش، نسخه، عکس دارو، گزارش تصویربرداری یا هر مدرک پزشکی مرتبط
          دارید، می‌توانید در این مرحله بارگذاری کنید. این بخش اختیاری است.
          این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی اولیه
          و هدایت مسیر مراجعه طراحی شده است.
        </p>

        {intakeData && (
          <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
            <h2 className="font-bold">شرح اولیه مراجعه</h2>
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
          <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
            <h2 className="font-bold">خلاصه انتخاب محل درد</h2>
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
          <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
            <h2 className="font-bold">دلیل مراجعه انتخاب‌شده</h2>
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
          <section className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950">
            <h2 className="font-bold">یادآوری علائم خطر</h2>
            <p className="mt-2 text-sm leading-7">
              اگر علائم شدید یا خطرناک دارید، منتظر ادامه فرآیند سامانه نمانید
              و فوراً با اورژانس تماس بگیرید.
            </p>
          </section>
        )}

        <div className="mt-8 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-lg font-bold text-teal-800">
            PDF
          </div>

          <h2 className="mt-5 text-xl font-bold text-blue-900">
            فایل‌های پزشکی خود را انتخاب کنید
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            فرمت‌های پیشنهادی: PDF، JPG، PNG
          </p>

          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="mt-6 block w-full cursor-pointer rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-700"
          />
        </div>

        {files.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-blue-900">
              فایل‌های انتخاب‌شده
            </h2>

            <div className="mt-4 space-y-3">
              {files.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-blue-900">آزمایش‌ها</h3>
            <p className="mt-2 text-sm text-gray-600">
              CBC، قند خون، چربی، تیروئید و سایر نتایج آزمایشگاهی
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-blue-900">نسخه‌ها و داروها</h3>
            <p className="mt-2 text-sm text-gray-600">
              نسخه‌های قبلی، عکس داروها یا لیست داروهای مصرفی
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-blue-900">تصویربرداری</h3>
            <p className="mt-2 text-sm text-gray-600">
              گزارش MRI، CT Scan، سونوگرافی یا رادیولوژی
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <h3 className="font-bold text-yellow-900">
            نکته مهم درباره حریم خصوصی
          </h3>

          <p className="mt-2 text-sm leading-7 text-yellow-900">
            در این نسخه sandbox، محتوای فایل‌ها به سرور ارسال نمی‌شود و فقط نام،
            نوع و حجم فایل برای شبیه‌سازی مسیر در مرورگر نگهداری می‌شود. در
            نسخه عملیاتی، مدارک پزشکی باید رمزگذاری شده و فقط با رضایت کاربر
            برای پزشک یا سرویس مجاز ارسال شوند.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-xl bg-blue-900 px-6 py-3 text-center text-white hover:bg-blue-800"
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
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            مدرکی ندارم، ادامه بده
          </button>

          <Link
            href={getBackHref(bodyMapData, visitReasonData, intakeData)}
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            بازگشت
          </Link>
        </div>
      </div>
    </main>
  );
}
