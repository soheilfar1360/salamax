"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  detectedFlow: "pain_flow" | "general_visit_flow" | "emergency_flow";
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
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              تنظیم اولویت انتخاب پزشک
            </h1>
            <p className="mt-3 max-w-3xl leading-8 text-gray-600">
              قبل از پیشنهاد پزشک، نوع ویزیت و اولویت اصلی خود را مشخص کنید تا
              رتبه‌بندی پزشکان با نیاز شما هماهنگ‌تر شود.
            </p>
          </div>

          <Link
            href="/results"
            className="rounded-xl border border-gray-300 px-5 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            بازگشت به نتایج
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900 md:col-span-2">
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
            <h2 className="font-bold text-blue-900">مدارک تحلیل‌شده</h2>
            <p className="mt-2 leading-7">{documentAnalyses.length} مورد</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-blue-900">نوع ویزیت</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {visitModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisitMode(option.value)}
                className={`rounded-2xl border p-5 text-right transition ${
                  visitMode === option.value
                    ? "border-teal-400 bg-teal-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-teal-200"
                }`}
              >
                <span className="font-bold text-blue-900">{option.title}</span>
                <span className="mt-2 block text-sm leading-7 text-gray-600">
                  {option.helper}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-blue-900">اولویت بیمار</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={`rounded-2xl border p-5 text-right transition ${
                  priority === option.value
                    ? "border-blue-400 bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-blue-200"
                }`}
              >
                <span className="font-bold text-blue-900">{option.title}</span>
                <span className="mt-2 block text-sm leading-7 text-gray-600">
                  {option.helper}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-bold text-blue-900">وزن‌دهی تطبیق پزشک</h2>
          <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-3">
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
            className="rounded-xl bg-blue-900 px-6 py-3 text-center text-white hover:bg-blue-800"
          >
            مشاهده پزشکان پیشنهادی
          </button>

          <Link
            href="/results"
            className="rounded-xl border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
          >
            بازگشت
          </Link>
        </div>
      </div>
    </main>
  );
}
