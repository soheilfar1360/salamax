"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ViewMode = "front" | "back";

type IntakeData = {
  chiefComplaint: string;
  detectedFlow: "pain_flow" | "general_visit_flow" | "emergency_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
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
      setIntakeData(safeReadStorage<IntakeData>("salamax_intake"));
      setIsMounted(true);
    });
  }, []);

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
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              ثبت نقاط درد روی بدن
            </h1>

            <p className="mt-3 max-w-2xl leading-8 text-gray-600">
              روی محل درد در تصویر بدن کلیک کنید. می‌توانید چند نقطه درد ثبت
              کنید. بین نمای جلو و پشت جابه‌جا شوید و هر نقطه‌ای را که لازم
              است مشخص کنید.
            </p>
          </div>

          <div className="rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-900">
            نقاط ثبت‌شده:{" "}
            <span className="font-bold">{painMarkers.length}</span>
          </div>
        </div>

        {isMounted && !intakeData && (
          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
            <h2 className="font-bold">یادآوری مسیر پیش‌ویزیت</h2>
            <p className="mt-2 leading-7">
              این صفحه معمولاً پس از ثبت شرح حال اولیه نمایش داده می‌شود.
            </p>
            <Link
              href="/intake"
              className="mt-4 inline-block rounded-xl border border-yellow-300 px-5 py-3 text-yellow-800 hover:bg-yellow-100"
            >
              بازگشت به ثبت شرح حال اولیه
            </Link>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-teal-200 bg-teal-50 p-5 text-teal-950 shadow-sm">
          <h2 className="font-bold">
            این مرحله فقط برای درد یا ناراحتی موضعی است
          </h2>
          <p className="mt-2 text-sm leading-7">
            اگر دلیل مراجعه شما چکاپ، بررسی آزمایش، تمدید نسخه یا مشاوره بدون
            درد موضعی است، بهتر است از مسیر دلیل مراجعه ادامه دهید. این صفحه
            برای ثبت محل‌های درد یا ناراحتی روی بدن طراحی شده است.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-gray-200 bg-slate-50 p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  مدل دوبعدی بدن
                </h2>
                <p className="mt-2 text-sm leading-7 text-gray-600">
                  روی تصویر کلیک کنید تا نشانگر درد همان‌جا ثبت شود.
                </p>
              </div>

              <div className="flex rounded-xl bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("front")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    viewMode === "front"
                      ? "bg-blue-900 text-white"
                      : "text-gray-700 hover:bg-slate-100"
                  }`}
                >
                  نمای جلو
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("back")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    viewMode === "back"
                      ? "bg-blue-900 text-white"
                      : "text-gray-700 hover:bg-slate-100"
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
                className="relative mx-auto h-[780px] w-[320px] cursor-crosshair outline-none focus:ring-4 focus:ring-teal-200"
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
              <h3 className="font-bold text-blue-900">نقاط درد ثبت‌شده</h3>
              {painMarkers.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {painMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        {marker.label} - {getViewLabel(marker.viewMode)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteMarker(marker.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-red-700 hover:bg-red-50"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  هنوز نقطه‌ای ثبت نشده است.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              اطلاعات تکمیلی درد
            </h2>

            <div className="mt-6">
              <label className="block text-right text-sm font-medium text-gray-700">
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

              <div className="mt-3 rounded-xl bg-slate-100 p-4 text-center text-2xl font-bold text-blue-900">
                {painLevel}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-right text-sm font-medium text-gray-700">
                توضیح تکمیلی
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-3 h-36 w-full rounded-xl border border-gray-300 p-4 text-right outline-none focus:border-blue-700"
                placeholder="مثلاً: درد از دیروز شروع شده و هنگام حرکت بیشتر می‌شود..."
                dir="rtl"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
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
              <p className="mt-4 text-sm text-red-600">
                برای ادامه، حداقل یک نقطه درد را روی بدن مشخص کنید.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleContinue}
                disabled={painMarkers.length === 0}
                className={`rounded-xl px-6 py-3 text-center text-white transition ${
                  painMarkers.length > 0
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
                بازگشت
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
