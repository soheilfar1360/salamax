"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type IntakeData = {
  chiefComplaint: string;
  detectedFlow: "pain_flow" | "general_visit_flow" | "emergency_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
  createdAt: string;
};

const visitReasons = [
  "چکاپ عمومی",
  "بررسی جواب آزمایش",
  "تمدید نسخه",
  "مشاوره تخصصی",
  "پیگیری بیماری قبلی",
  "مشاوره دارویی",
  "سایر موارد",
];

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeReadStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  return safeParse<T>(window.localStorage.getItem(key));
}

export default function VisitReasonPage() {
  const router = useRouter();
  const [intake] = useState<IntakeData | null>(() =>
    safeReadStorage<IntakeData>("salamax_intake")
  );
  const [selectedReason, setSelectedReason] = useState("");

  function handleContinue() {
    if (!selectedReason) return;

    const visitReasonData = {
      reason: selectedReason,
      chiefComplaint: intake?.chiefComplaint ?? "",
      requiresBodyMap: false,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "salamax_visit_reason",
      JSON.stringify(visitReasonData)
    );

    router.push("/upload");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              دلیل مراجعه
            </h1>

            <p className="mt-3 max-w-2xl leading-8 text-gray-600">
              این صفحه برای دلیل‌های مراجعه بدون درد موضعی است؛ مثل چکاپ،
              بررسی آزمایش، تمدید نسخه، پیگیری بیماری قبلی یا پرسش دارویی.
              گزینه‌ای را انتخاب کنید تا بدون نقشه بدن ادامه بدهیم.
            </p>
          </div>

          <Link
            href="/intake"
            className="rounded-xl border border-gray-300 px-5 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            بازگشت به پیش‌ویزیت
          </Link>
        </div>

        <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-900 shadow-sm">
          <h2 className="font-bold">شرح ثبت‌شده</h2>
          <p className="mt-3 leading-8">
            {intake?.chiefComplaint || "شرح اولیه‌ای در مرورگر پیدا نشد."}
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visitReasons.map((reason) => {
            const isSelected = selectedReason === reason;

            return (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`rounded-3xl border p-5 text-right shadow-sm transition ${
                  isSelected
                    ? "border-teal-400 bg-teal-50 text-teal-950 shadow-md"
                    : "border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50"
                }`}
              >
                <span className="text-lg font-bold">{reason}</span>
                <span className="mt-2 block text-sm leading-7">
                  {isSelected
                    ? "این دلیل برای ادامه مسیر انتخاب شده است."
                    : "برای انتخاب این مسیر کلیک کنید."}
                </span>
              </button>
            );
          })}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedReason}
            className={`rounded-xl px-6 py-3 text-center text-white transition ${
              selectedReason
                ? "bg-blue-900 hover:bg-blue-800"
                : "cursor-not-allowed bg-gray-400"
            }`}
          >
            ادامه به آپلود مدارک
          </button>

          <Link
            href="/intake"
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            اصلاح شرح اولیه
          </Link>
        </div>
      </div>
    </main>
  );
}
