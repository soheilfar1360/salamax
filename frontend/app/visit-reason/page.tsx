"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FlowStepper from "@/components/FlowStepper";

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
    <main className="min-h-screen bg-[#F6FBFC] px-4 py-8 text-[#183B56] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <FlowStepper currentStep="route" />
      <div className="rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(95,221,218,0.18)] bg-[rgba(39,214,208,0.08)] px-4 py-2 text-sm font-bold text-[#27D6D0]">
              مسیر بدون درد موضعی
            </span>
            <h1 className="mt-4 text-3xl font-bold text-[#102A43]">
              دلیل مراجعه
            </h1>

            <p className="mt-3 max-w-2xl leading-8 text-[#64748B]">
              این صفحه برای دلیل‌های مراجعه بدون درد موضعی است؛ مثل چکاپ،
              بررسی آزمایش، تمدید نسخه، پیگیری بیماری قبلی یا پرسش دارویی.
              گزینه‌ای را انتخاب کنید تا بدون نقشه بدن ادامه بدهیم.
            </p>
          </div>

          <Link
            href="/intake"
            className="rounded-2xl border border-[#D7ECEF] bg-white px-5 py-3 text-center text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8]"
          >
            بازگشت به پیش‌ویزیت
          </Link>
        </div>

        <section className="mt-8 rounded-3xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
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
                    ? "border-[#20C9C3] bg-[#EAFBF8] text-[#102A43] shadow-md"
                    : "border-[#D7ECEF] bg-white text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8]"
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
            className={`rounded-xl px-6 py-3 text-center font-bold transition ${
              selectedReason
                ? "bg-[#20C9C3] text-[#102A43] shadow-sm hover:bg-[#0E8F8A] hover:text-white"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            ادامه به آپلود مدارک
          </button>

          <Link
            href="/intake"
            className="rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8]"
          >
            اصلاح شرح اولیه
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
