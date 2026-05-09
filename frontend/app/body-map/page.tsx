"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ViewMode = "front" | "back";

type RegionId =
  | "head"
  | "neck"
  | "chest"
  | "abdomen"
  | "pelvis"
  | "left-arm"
  | "right-arm"
  | "left-hand"
  | "right-hand"
  | "left-thigh"
  | "right-thigh"
  | "left-knee"
  | "right-knee"
  | "left-leg"
  | "right-leg"
  | "left-foot"
  | "right-foot"
  | "upper-back"
  | "lower-back"
  | "left-shoulder"
  | "right-shoulder";

const regionLabels: Record<RegionId, string> = {
  head: "سر",
  neck: "گردن",
  chest: "قفسه سینه",
  abdomen: "شکم",
  pelvis: "لگن",
  "left-arm": "دست چپ",
  "right-arm": "دست راست",
  "left-hand": "کف دست چپ",
  "right-hand": "کف دست راست",
  "left-thigh": "ران چپ",
  "right-thigh": "ران راست",
  "left-knee": "زانوی چپ",
  "right-knee": "زانوی راست",
  "left-leg": "ساق پای چپ",
  "right-leg": "ساق پای راست",
  "left-foot": "پای چپ",
  "right-foot": "پای راست",
  "upper-back": "پشت قفسه سینه",
  "lower-back": "کمر",
  "left-shoulder": "شانه چپ",
  "right-shoulder": "شانه راست",
};

type Hotspot = {
  id: RegionId;
  className: string;
  rounded?: string;
};

type IntakeData = {
  chiefComplaint: string;
  detectedFlow: "pain_flow" | "general_visit_flow" | "emergency_flow";
  hasPain: boolean;
  requiresBodyMap: boolean;
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

const frontHotspots: Hotspot[] = [
  {
    id: "head",
    className: "top-[18px] left-1/2 -translate-x-1/2 w-[76px] h-[92px]",
    rounded: "rounded-full",
  },
  {
    id: "neck",
    className: "top-[108px] left-1/2 -translate-x-1/2 w-[56px] h-[36px]",
    rounded: "rounded-xl",
  },
  {
    id: "chest",
    className: "top-[145px] left-1/2 -translate-x-1/2 w-[150px] h-[95px]",
    rounded: "rounded-3xl",
  },
  {
    id: "abdomen",
    className: "top-[238px] left-1/2 -translate-x-1/2 w-[128px] h-[100px]",
    rounded: "rounded-3xl",
  },
  {
    id: "pelvis",
    className: "top-[338px] left-1/2 -translate-x-1/2 w-[112px] h-[62px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-arm",
    className: "top-[158px] left-[8px] w-[70px] h-[178px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-arm",
    className: "top-[158px] right-[8px] w-[70px] h-[178px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-hand",
    className: "top-[326px] left-[0px] w-[70px] h-[86px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-hand",
    className: "top-[326px] right-[0px] w-[70px] h-[86px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-thigh",
    className: "top-[404px] left-[106px] w-[52px] h-[132px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-thigh",
    className: "top-[404px] right-[106px] w-[52px] h-[132px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-knee",
    className: "top-[536px] left-[106px] w-[52px] h-[42px]",
    rounded: "rounded-2xl",
  },
  {
    id: "right-knee",
    className: "top-[536px] right-[106px] w-[52px] h-[42px]",
    rounded: "rounded-2xl",
  },
  {
    id: "left-leg",
    className: "top-[578px] left-[110px] w-[46px] h-[150px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-leg",
    className: "top-[578px] right-[110px] w-[46px] h-[150px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-foot",
    className: "top-[726px] left-[98px] w-[60px] h-[52px]",
    rounded: "rounded-2xl",
  },
  {
    id: "right-foot",
    className: "top-[726px] right-[98px] w-[60px] h-[52px]",
    rounded: "rounded-2xl",
  },
];

const backHotspots: Hotspot[] = [
  {
    id: "head",
    className: "top-[18px] left-1/2 -translate-x-1/2 w-[76px] h-[92px]",
    rounded: "rounded-full",
  },
  {
    id: "neck",
    className: "top-[106px] left-1/2 -translate-x-1/2 w-[56px] h-[34px]",
    rounded: "rounded-xl",
  },
  {
    id: "left-shoulder",
    className: "top-[145px] left-[58px] w-[72px] h-[56px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-shoulder",
    className: "top-[145px] right-[58px] w-[72px] h-[56px]",
    rounded: "rounded-3xl",
  },
  {
    id: "upper-back",
    className: "top-[178px] left-1/2 -translate-x-1/2 w-[150px] h-[105px]",
    rounded: "rounded-3xl",
  },
  {
    id: "lower-back",
    className: "top-[286px] left-1/2 -translate-x-1/2 w-[132px] h-[104px]",
    rounded: "rounded-3xl",
  },
  {
    id: "pelvis",
    className: "top-[386px] left-1/2 -translate-x-1/2 w-[114px] h-[58px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-arm",
    className: "top-[158px] left-[6px] w-[74px] h-[190px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-arm",
    className: "top-[158px] right-[6px] w-[74px] h-[190px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-hand",
    className: "top-[336px] left-[0px] w-[72px] h-[82px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-hand",
    className: "top-[336px] right-[0px] w-[72px] h-[82px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-thigh",
    className: "top-[448px] left-[106px] w-[52px] h-[124px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-thigh",
    className: "top-[448px] right-[106px] w-[52px] h-[124px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-knee",
    className: "top-[572px] left-[106px] w-[52px] h-[38px]",
    rounded: "rounded-2xl",
  },
  {
    id: "right-knee",
    className: "top-[572px] right-[106px] w-[52px] h-[38px]",
    rounded: "rounded-2xl",
  },
  {
    id: "left-leg",
    className: "top-[610px] left-[110px] w-[46px] h-[126px]",
    rounded: "rounded-3xl",
  },
  {
    id: "right-leg",
    className: "top-[610px] right-[110px] w-[46px] h-[126px]",
    rounded: "rounded-3xl",
  },
  {
    id: "left-foot",
    className: "top-[734px] left-[98px] w-[60px] h-[44px]",
    rounded: "rounded-2xl",
  },
  {
    id: "right-foot",
    className: "top-[734px] right-[98px] w-[60px] h-[44px]",
    rounded: "rounded-2xl",
  },
];

export default function BodyMapPage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("front");
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [painLevel, setPainLevel] = useState(5);
  const [description, setDescription] = useState("");

  const selectedLabel = selectedRegion
    ? regionLabels[selectedRegion]
    : "هنوز انتخاب نشده";

  const hotspots = useMemo(() => {
    return viewMode === "front" ? frontHotspots : backHotspots;
  }, [viewMode]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setIntakeData(safeReadStorage<IntakeData>("salamax_intake"));
      setIsMounted(true);
    });
  }, []);

  function handleContinue() {
    if (!selectedRegion) return;

    const bodyMapData = {
      viewMode,
      selectedRegion,
      selectedLabel,
      painLevel,
      description,
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
              انتخاب محل درد
            </h1>

            <p className="mt-3 max-w-2xl leading-8 text-gray-600">
              لطفاً روی ناحیه‌ای از بدن که درد، ناراحتی یا مشکل دارید کلیک کنید.
              می‌توانید بین نمای جلو و پشت بدن جابه‌جا شوید. این اطلاعات به
              سامانه کمک می‌کند سؤال‌های دقیق‌تری بپرسد.
            </p>
          </div>

          <div className="rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-900">
            ناحیه انتخاب‌شده:{" "}
            <span className="font-bold">{selectedLabel}</span>
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
          <h2 className="font-bold">این مرحله فقط برای درد یا ناراحتی موضعی است</h2>
          <p className="mt-2 text-sm leading-7">
            اگر دلیل مراجعه شما چکاپ، بررسی آزمایش، تمدید نسخه یا مشاوره بدون
            درد موضعی است، بهتر است از مسیر دلیل مراجعه ادامه دهید. استفاده از
            این صفحه برای انتخاب محل درد اختیاری و مخصوص علائم موضعی است.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-gray-200 bg-slate-50 p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-700">
                مدل دوبعدی بدن
              </h2>

              <div className="flex rounded-xl bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("front");
                    setSelectedRegion(null);
                  }}
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
                  onClick={() => {
                    setViewMode("back");
                    setSelectedRegion(null);
                  }}
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
              <div className="relative mx-auto h-[780px] w-[320px]">
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
                  className="object-contain"
                  priority
                />

                {hotspots.map((spot) => {
                  const isSelected = selectedRegion === spot.id;

                  return (
                    <button
                      key={`${viewMode}-${spot.id}`}
                      type="button"
                      onClick={() => setSelectedRegion(spot.id)}
                      title={regionLabels[spot.id]}
                      className={[
                        "absolute z-10 cursor-pointer border-2 transition",
                        spot.className,
                        spot.rounded ?? "rounded-xl",
                        isSelected
                          ? "border-teal-600 bg-teal-400/35 shadow-md"
                          : "border-transparent hover:border-teal-500 hover:bg-teal-300/20",
                      ].join(" ")}
                    >
                      <span className="sr-only">{regionLabels[spot.id]}</span>
                    </button>
                  );
                })}
              </div>
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
                onChange={(e) => setPainLevel(Number(e.target.value))}
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
                onChange={(e) => setDescription(e.target.value)}
                className="mt-3 h-36 w-full rounded-xl border border-gray-300 p-4 text-right outline-none focus:border-blue-700"
                placeholder="مثلاً: درد از دیروز شروع شده و هنگام حرکت یا نفس کشیدن بیشتر می‌شود..."
                dir="rtl"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
              <p>
                <span className="font-bold">ناحیه انتخاب‌شده:</span>{" "}
                {selectedLabel}
              </p>

              <p className="mt-2">
                <span className="font-bold">شدت درد:</span> {painLevel} از ۱۰
              </p>

              <p className="mt-2">
                <span className="font-bold">نمای فعلی:</span>{" "}
                {viewMode === "front" ? "جلو" : "پشت"}
              </p>

              {description.trim() && (
                <p className="mt-2">
                  <span className="font-bold">توضیح:</span> {description}
                </p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-7 text-yellow-900">
              اگر درد شدید قفسه سینه، تنگی نفس، ضعف ناگهانی یک سمت بدن، بیهوشی
              یا خونریزی شدید دارید، منتظر تحلیل سامانه نمانید و فوراً با
              اورژانس تماس بگیرید.
            </div>

            {!selectedRegion && (
              <p className="mt-4 text-sm text-red-600">
                برای ادامه، لطفاً یک ناحیه از بدن را انتخاب کنید.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedRegion}
                className={`rounded-xl px-6 py-3 text-center text-white transition ${
                  selectedRegion
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
