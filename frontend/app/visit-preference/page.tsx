"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FlowStepper from "@/components/FlowStepper";

type VisitMode = "online" | "in_person" | "any";
type Priority =
  | "distance"
  | "specialty"
  | "rating"
  | "availability"
  | "punctuality"
  | "balanced";

type Weights = {
  specialty: number;
  distance: number;
  rating: number;
  availability: number;
  punctuality: number;
  visitMode: number;
};

type IntakeData = {
  chiefComplaint: string;
  detectedFlow:
    | "pain_flow"
    | "general_visit_flow"
    | "emergency_flow"
    | "veterinary_flow";
  profileType?: "human" | "pet";
};

type BodyMapData = {
  selectedLabel: string;
  painLevel: number;
};

type VisitReasonData = {
  reason: string;
};

type DocumentAnalysis = {
  documentType: string;
  isMock?: boolean;
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

function getBaseWeights(priority: Priority): Weights {
  if (priority === "distance") {
    return {
      distance: 0.35,
      specialty: 0.25,
      rating: 0.15,
      availability: 0.1,
      punctuality: 0.1,
      visitMode: 0.05,
    };
  }

  if (priority === "specialty") {
    return {
      specialty: 0.4,
      rating: 0.2,
      availability: 0.15,
      punctuality: 0.15,
      distance: 0.05,
      visitMode: 0.05,
    };
  }

  if (priority === "rating") {
    return {
      rating: 0.35,
      specialty: 0.25,
      punctuality: 0.15,
      availability: 0.1,
      distance: 0.1,
      visitMode: 0.05,
    };
  }

  if (priority === "availability") {
    return {
      availability: 0.35,
      specialty: 0.25,
      rating: 0.15,
      punctuality: 0.1,
      distance: 0.1,
      visitMode: 0.05,
    };
  }

  if (priority === "punctuality") {
    return {
      punctuality: 0.35,
      specialty: 0.25,
      rating: 0.15,
      availability: 0.1,
      distance: 0.1,
      visitMode: 0.05,
    };
  }

  return {
    specialty: 0.25,
    distance: 0.15,
    rating: 0.2,
    availability: 0.15,
    punctuality: 0.15,
    visitMode: 0.1,
  };
}

function getWeights(priority: Priority, visitMode: VisitMode): Weights {
  const weights = getBaseWeights(priority);

  if (visitMode !== "online" || weights.distance === 0) return weights;

  const distanceWeight = weights.distance;
  return {
    ...weights,
    distance: 0,
    specialty: Number((weights.specialty + distanceWeight * 0.6).toFixed(3)),
    availability: Number(
      (weights.availability + distanceWeight * 0.4).toFixed(3)
    ),
  };
}

const visitModeOptions: Array<{
  value: VisitMode;
  title: string;
  helper: string;
}> = [
  {
    value: "online",
    title: "ویزیت آنلاین",
    helper: "تمرکز روی پزشکانی که امکان مشاوره آنلاین دارند.",
  },
  {
    value: "in_person",
    title: "ویزیت حضوری",
    helper: "فاصله و دسترسی حضوری در امتیازدهی اثر دارد.",
  },
  {
    value: "any",
    title: "فرقی ندارد، بهترین گزینه را پیشنهاد بده",
    helper: "سامانه بین آنلاین و حضوری بهترین تطبیق را انتخاب می‌کند.",
  },
];

const priorityOptions: Array<{
  value: Priority;
  title: string;
  helper: string;
}> = [
  {
    value: "distance",
    title: "نزدیک‌ترین پزشک",
    helper: "فاصله حضوری وزن بیشتری می‌گیرد.",
  },
  {
    value: "specialty",
    title: "تخصص مرتبط‌تر",
    helper: "ارتباط تخصص با شرح حال در اولویت قرار می‌گیرد.",
  },
  {
    value: "rating",
    title: "بالاترین امتیاز",
    helper: "امتیاز پزشک در رتبه‌بندی پررنگ‌تر می‌شود.",
  },
  {
    value: "availability",
    title: "زودترین نوبت",
    helper: "نوبت‌های نزدیک‌تر امتیاز بیشتری می‌گیرند.",
  },
  {
    value: "punctuality",
    title: "کمترین احتمال تأخیر",
    helper: "سابقه خوش‌قولی پزشک در اولویت است.",
  },
  {
    value: "balanced",
    title: "تعادل همه موارد",
    helper: "تخصص، امتیاز، نوبت، فاصله و نوع ویزیت متعادل می‌شوند.",
  },
];

function getFlowLabel(flow?: IntakeData["detectedFlow"]) {
  if (flow === "pain_flow") return "مسیر درد";
  if (flow === "general_visit_flow") return "مسیر مراجعه عمومی";
  if (flow === "emergency_flow") return "مسیر علائم هشدار";
  if (flow === "veterinary_flow") return "مسیر دامپزشکی";
  return "ثبت نشده";
}

export default function VisitPreferencePage() {
  const router = useRouter();
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [bodyMapData, setBodyMapData] = useState<BodyMapData | null>(null);
  const [visitReasonData, setVisitReasonData] =
    useState<VisitReasonData | null>(null);
  const [documentAnalyses, setDocumentAnalyses] = useState<DocumentAnalysis[]>(
    []
  );
  const [visitMode, setVisitMode] = useState<VisitMode>("any");
  const [priority, setPriority] = useState<Priority>("balanced");

  useEffect(() => {
    void Promise.resolve().then(() => {
      setIntakeData(safeReadStorage<IntakeData>("salamax_intake"));
      setBodyMapData(safeReadStorage<BodyMapData>("salamax_body_map"));
      setVisitReasonData(
        safeReadStorage<VisitReasonData>("salamax_visit_reason")
      );
      setDocumentAnalyses(
        safeReadStorage<DocumentAnalysis[]>("salamax_document_analyses") ?? []
      );
    });
  }, []);

  const weights = useMemo(
    () => getWeights(priority, visitMode),
    [priority, visitMode]
  );

  function handleContinue() {
    localStorage.setItem(
      "salamax_visit_preference",
      JSON.stringify({
        visitMode,
        priority,
        weights,
        createdAt: new Date().toISOString(),
      })
    );

    router.push("/doctor-match");
  }

  return (
    <main className="min-h-screen bg-[#F6FBFC] px-4 py-8 text-[#183B56] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <FlowStepper currentStep="preference" />
      <div className="rounded-3xl border border-[#D7ECEF] bg-white p-6 text-[#183B56] shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
              اولویت‌های تطبیق پزشک
            </span>
            <h1 className="mt-4 text-3xl font-bold text-blue-950">
              تنظیم اولویت انتخاب پزشک
            </h1>
            <p className="mt-3 max-w-3xl leading-8 text-[#64748B]">
              قبل از پیشنهاد پزشک، نوع ویزیت و اولویت اصلی خود را مشخص کنید تا
              رتبه‌بندی پزشکان با نیاز شما هماهنگ‌تر شود.
            </p>
          </div>

          <Link
            href="/results"
            className="rounded-2xl border border-[#D7ECEF] bg-white px-5 py-3 text-center text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8]"
          >
            بازگشت به نتایج
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm md:col-span-2">
            <h2 className="font-bold">خلاصه مسیر</h2>
            <p className="mt-2 leading-7">
              {intakeData?.chiefComplaint || "شرح حال اولیه ثبت نشده است."}
            </p>
            <p className="mt-2 text-sm">{getFlowLabel(intakeData?.detectedFlow)}</p>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
            <h2 className="font-bold">
              {bodyMapData ? "محل درد" : "دلیل مراجعه"}
            </h2>
            <p className="mt-2 leading-7">
              {bodyMapData?.selectedLabel ??
                visitReasonData?.reason ??
                "ثبت نشده"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7ECEF] bg-[#EAFBF8] p-5 text-[#183B56]">
            <h2 className="font-bold text-[#102A43]">مدارک تحلیل‌شده</h2>
            <p className="mt-2 leading-7">{documentAnalyses.length} مورد</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#102A43]">نوع ویزیت</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {visitModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisitMode(option.value)}
                className={`rounded-2xl border p-5 text-right transition ${
                  visitMode === option.value
                    ? "border-teal-400 bg-teal-50 shadow-md"
                    : "border-[#D7ECEF] bg-white shadow-sm hover:border-[#20C9C3] hover:bg-[#EAFBF8]"
                }`}
              >
                <span className="font-bold text-[#102A43]">{option.title}</span>
                <span className="mt-2 block text-sm leading-7 text-[#64748B]">
                  {option.helper}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#102A43]">اولویت بیمار</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={`rounded-2xl border p-5 text-right transition ${
                  priority === option.value
                    ? "border-[#20C9C3] bg-[#EAFBF8] shadow-md"
                    : "border-[#D7ECEF] bg-white shadow-sm hover:border-[#20C9C3] hover:bg-[#EAFBF8]"
                }`}
              >
                <span className="font-bold text-blue-900">{option.title}</span>
                <span className="mt-2 block text-sm leading-7 text-[#64748B]">
                  {option.helper}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#D7ECEF] bg-white p-5 text-[#183B56] shadow-sm">
          <h2 className="font-bold text-[#102A43]">وزن‌دهی تطبیق پزشک</h2>
          <p className="mt-2 text-sm leading-7 text-[#64748B]">
            این وزن‌ها نشان می‌دهند کدام معیارها در رتبه‌بندی پزشکان پررنگ‌تر
            می‌شوند. در ویزیت آنلاین، فاصله از امتیازدهی حذف می‌شود.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-[#183B56] md:grid-cols-3">
            <p>تخصص: {Math.round(weights.specialty * 100)}٪</p>
            <p>فاصله: {Math.round(weights.distance * 100)}٪</p>
            <p>امتیاز: {Math.round(weights.rating * 100)}٪</p>
            <p>زودترین نوبت: {Math.round(weights.availability * 100)}٪</p>
            <p>خوش‌قولی: {Math.round(weights.punctuality * 100)}٪</p>
            <p>نوع ویزیت: {Math.round(weights.visitMode * 100)}٪</p>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-[#20C9C3] px-6 py-3 text-center font-bold text-[#102A43] shadow-sm hover:bg-[#0E8F8A] hover:text-white sm:w-auto"
          >
            مشاهده پزشکان پیشنهادی
          </button>

          <Link
            href="/results"
            className="w-full rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] hover:border-[#20C9C3] hover:bg-[#EAFBF8] sm:w-auto"
          >
            بازگشت
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
