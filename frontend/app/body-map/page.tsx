"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FlowStepper from "@/components/FlowStepper";

type ViewMode = "front" | "back";

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
  relation?: string;
  petType?: string;
  breed?: string;
  vaccinationStatus?: string;
  petNotes?: string;
  doctorSummary?: string;
  createdAt: string;
};

type PainMarker = {
  id: string;
  viewMode: ViewMode;
  xPercent: number;
  yPercent: number;
  label: string;
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

function getViewLabel(viewMode: ViewMode) {
  return viewMode === "front" ? "نمای جلو" : "نمای پشت";
}

function getSelectedLabel(markerCount: number) {
  if (markerCount > 1) return "چند نقطه درد ثبت شده";
  if (markerCount === 1) return "یک نقطه درد ثبت شده";
  return "نامشخص";
}

function createMarkerId(viewMode: ViewMode, markerNumber: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pain-marker-${viewMode}-${markerNumber}`;
}

function hasVeterinarySignal(value?: string | null) {
  const text = value?.trim() ?? "";
  return (
    text.includes("دامپزشک") ||
    text.includes("دامپزشکی") ||
    text.includes("حیوان خانگی")
  );
}

function isPetCase(data: IntakeData | null) {
  const petRelations = ["سگ", "گربه", "پرنده", "خرگوش", "حیوان خانگی"];
  const relation = data?.relation?.trim() ?? "";

  return Boolean(
    data?.profileType === "pet" ||
      data?.detectedFlow === "veterinary_flow" ||
      hasVeterinarySignal(data?.suggestedSpecialty) ||
      hasVeterinarySignal(data?.doctorSummary) ||
      petRelations.includes(relation) ||
      data?.petType?.trim() ||
      data?.breed?.trim() ||
      data?.vaccinationStatus?.trim() ||
      data?.petNotes?.trim()
  );
}

export default function BodyMapPage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("front");
  const [painMarkers, setPainMarkers] = useState<PainMarker[]>([]);
  const [nextMarkerNumber, setNextMarkerNumber] = useState(1);
  const [painLevel, setPainLevel] = useState(5);
  const [description, setDescription] = useState("");

  const visibleMarkers = useMemo(
    () => painMarkers.filter((marker) => marker.viewMode === viewMode),
    [painMarkers, viewMode]
  );
  const selectedLabel = getSelectedLabel(painMarkers.length);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storedIntake = safeReadStorage<IntakeData>("salamax_intake");

      if (isPetCase(storedIntake)) {
        router.replace("/results");
        return;
      }

      setIntakeData(storedIntake);
      setIsMounted(true);
    });
  }, [router]);

  function handleBodyClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    const markerNumber = nextMarkerNumber;

    setPainMarkers((currentMarkers) => [
      ...currentMarkers,
      {
        id: createMarkerId(viewMode, markerNumber),
        viewMode,
        xPercent: Number(xPercent.toFixed(2)),
        yPercent: Number(yPercent.toFixed(2)),
        label: `نقطه درد ${markerNumber}`,
      },
    ]);
    setNextMarkerNumber((currentNumber) => currentNumber + 1);
  }

  function deleteMarker(markerId: string) {
    setPainMarkers((currentMarkers) =>
      currentMarkers.filter((marker) => marker.id !== markerId)
    );
  }

  function handleContinue() {
    if (painMarkers.length === 0) return;

    const bodyMapData = {
      viewMode,
      painMarkers,
      painLevel,
      description,
      selectedLabel,
      selectedRegion: null,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("salamax_body_map", JSON.stringify(bodyMapData));
    router.push("/upload");
  }
  return (
    <main className="min-h-screen bg-[#F6FBFC] px-4 pb-28 pt-8 text-[#183B56] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <FlowStepper currentStep="route" />

        <div className="mt-8 rounded-3xl border border-[#D7ECEF] bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                ثبت درد موضعی
              </span>

              <h1 className="mt-4 text-3xl font-bold text-[#102A43]">
                ثبت نقاط درد روی بدن
              </h1>

              <p className="mt-3 max-w-2xl leading-8 text-[#64748B]">
                روی محل درد در تصویر بدن کلیک کنید. می‌توانید چند نقطه درد ثبت
                کنید. بین نمای جلو و پشت جابه‌جا شوید و هر نقطه‌ای را که لازم
                است مشخص کنید.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D7ECEF] bg-[#EAFBF8] px-5 py-4 text-sm text-[#0E8F8A]">
              نقاط ثبت‌شده:{" "}
              <span className="font-bold">{painMarkers.length}</span>
            </div>
          </div>

          {isMounted && !intakeData && (
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-[#183B56]">
              <h2 className="font-bold text-[#102A43]">
                یادآوری مسیر پیش‌ویزیت
              </h2>
              <p className="mt-2 leading-7 text-[#64748B]">
                این صفحه معمولاً پس از ثبت شرح حال اولیه نمایش داده می‌شود.
              </p>
              <Link
                href="/intake"
                className="mt-4 inline-block rounded-xl border border-yellow-300 bg-white px-5 py-3 text-yellow-800 hover:bg-yellow-100"
              >
                بازگشت به ثبت شرح حال اولیه
              </Link>
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-[#20C9C3] bg-[#EAFBF8] p-5 text-[#183B56] shadow-sm">
            <h2 className="font-bold text-[#102A43]">
              این مرحله فقط برای درد یا ناراحتی موضعی است
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#64748B]">
              اگر دلیل مراجعه شما چکاپ، بررسی آزمایش، تمدید نسخه یا مشاوره بدون
              درد موضعی است، بهتر است از مسیر دلیل مراجعه ادامه دهید. این صفحه
              برای ثبت محل‌های درد یا ناراحتی روی بدن طراحی شده است.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-[#D7ECEF] bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#102A43]">
                    مدل دوبعدی بدن
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[#64748B]">
                    روی تصویر کلیک کنید تا نشانگر درد همان‌جا ثبت شود.
                  </p>
                </div>

                <div className="flex rounded-xl border border-[#D7ECEF] bg-[#F6FBFC] p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode("front")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      viewMode === "front"
                        ? "bg-[#20C9C3] text-[#061923]"
                        : "text-[#64748B] hover:bg-[#EAFBF8]"
                    }`}
                  >
                    نمای جلو
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("back")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      viewMode === "back"
                        ? "bg-[#20C9C3] text-[#061923]"
                        : "text-[#64748B] hover:bg-[#EAFBF8]"
                    }`}
                  >
                    نمای پشت
                  </button>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[360px]">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleBodyClick}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                    }
                  }}
                  className="relative mx-auto h-[min(680px,145vw)] w-full max-w-[320px] cursor-crosshair outline-none focus:ring-4 focus:ring-teal-200 sm:h-[780px]"
                  aria-label="ثبت نقطه درد روی تصویر بدن"
                >
                  <Image
                    src={
                      viewMode === "front"
                        ? "/body-front.png"
                        : "/body-back.png"
                    }
                    alt={
                      viewMode === "front"
                        ? "مدل بدن از روبه‌رو"
                        : "مدل بدن از پشت"
                    }
                    fill
                    className="pointer-events-none object-contain"
                    priority
                  />

                  {visibleMarkers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteMarker(marker.id);
                      }}
                      title={`${marker.label} - حذف`}
                      className="absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-600 text-xs font-bold text-white shadow-lg ring-4 ring-red-500/25 transition hover:scale-110 hover:bg-red-700"
                      style={{
                        left: `${marker.xPercent}%`,
                        top: `${marker.yPercent}%`,
                      }}
                    >
                      <span className="absolute h-7 w-7 animate-ping rounded-full bg-red-500 opacity-20" />
                      <span className="relative">
                        {marker.label.replace("نقطه درد ", "")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-[#102A43]">
                  نقاط درد ثبت‌شده
                </h3>

                {painMarkers.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {painMarkers.map((marker) => (
                      <div
                        key={marker.id}
                        className="flex flex-col gap-3 rounded-xl border border-[#D7ECEF] bg-[#F6FBFC] p-4 text-sm text-[#183B56] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span>
                          {marker.label} - {getViewLabel(marker.viewMode)}
                        </span>

                        <button
                          type="button"
                          onClick={() => deleteMarker(marker.id)}
                          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-red-700 hover:bg-red-50"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[#64748B]">
                    هنوز نقطه‌ای ثبت نشده است.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[#D7ECEF] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-[#102A43]">
                اطلاعات تکمیلی درد
              </h2>

              <div className="mt-6">
                <label className="block text-right text-sm font-medium text-[#183B56]">
                  شدت درد از ۱ تا ۱۰
                </label>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={painLevel}
                  onChange={(event) => setPainLevel(Number(event.target.value))}
                  className="mt-4 w-full"
                />

                <div className="mt-3 rounded-xl bg-[#EAFBF8] p-4 text-center text-2xl font-bold text-[#102A43]">
                  {painLevel}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-right text-sm font-medium text-[#183B56]">
                  توضیح تکمیلی
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-3 h-36 w-full rounded-xl border border-[#D7ECEF] bg-white p-4 text-right text-[#183B56] outline-none placeholder:text-[#94A3B8] focus:border-[#20C9C3]"
                  placeholder="مثلاً: درد از دیروز شروع شده و هنگام حرکت بیشتر می‌شود..."
                  dir="rtl"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-[#D7ECEF] bg-[#F6FBFC] p-4 text-sm leading-7 text-[#183B56]">
                <p>
                  <span className="font-bold">وضعیت نقاط درد:</span>{" "}
                  {selectedLabel}
                </p>

                <p className="mt-2">
                  <span className="font-bold">شدت درد:</span> {painLevel} از ۱۰
                </p>

                <p className="mt-2">
                  <span className="font-bold">نمای فعلی:</span>{" "}
                  {getViewLabel(viewMode)}
                </p>

                {description.trim() && (
                  <p className="mt-2">
                    <span className="font-bold">توضیح:</span> {description}
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-7 text-yellow-900">
                اگر درد شدید قفسه سینه، تنگی نفس، ضعف ناگهانی یک سمت بدن،
                بیهوشی یا خونریزی شدید دارید، منتظر تحلیل سامانه نمانید و فوراً
                با اورژانس تماس بگیرید.
              </div>

              {painMarkers.length === 0 && (
                <p className="mt-4 text-sm text-[#E5484D]">
                  برای ادامه، حداقل یک نقطه درد را روی بدن مشخص کنید.
                </p>
              )}

              <div className="mt-6 hidden flex-col gap-3 sm:flex sm:flex-row">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={painMarkers.length === 0}
                  className={`rounded-xl px-6 py-3 text-center font-bold transition ${
                    painMarkers.length > 0
                      ? "bg-[#20C9C3] text-[#061923] hover:bg-[#0E8F8A] hover:text-white"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  ادامه به آپلود مدارک
                </button>

                <Link
                  href="/intake"
                  className="rounded-xl border border-[#D7ECEF] bg-white px-6 py-3 text-center text-[#183B56] hover:bg-[#EAFBF8]"
                >
                  بازگشت
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#D7ECEF] bg-white/95 p-3 shadow-2xl backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <button
            type="button"
            onClick={handleContinue}
            disabled={painMarkers.length === 0}
            className={`flex-1 rounded-2xl px-5 py-3 text-center font-bold transition ${
              painMarkers.length > 0
                ? "bg-[#20C9C3] text-[#061923] hover:bg-[#0E8F8A] hover:text-white"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            ادامه به آپلود
          </button>

          <Link
            href="/intake"
            className="rounded-2xl border border-[#D7ECEF] bg-white px-5 py-3 text-center text-[#183B56]"
          >
            بازگشت
          </Link>
        </div>
      </div>
    </main>
  );

}