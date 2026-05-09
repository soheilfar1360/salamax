"use client";

import { useState } from "react";
import Link from "next/link";

type StorageItem = {
  key: string;
  label: string;
  value: unknown;
};

const storageKeys = [
  {
    key: "salamax_intake",
    label: "داده مسیر پیش‌ویزیت",
  },
  {
    key: "salamax_visit_reason",
    label: "دلیل مراجعه",
  },
  {
    key: "salamax_body_map",
    label: "نقشه بدن",
  },
  {
    key: "salamax_uploaded_files",
    label: "مدارک انتخاب‌شده",
  },
  {
    key: "salamax_triage_result",
    label: "نتیجه تحلیل",
  },
  {
    key: "salamax_doctor_match",
    label: "تطبیق پزشک",
  },
  {
    key: "salamax_selected_doctor",
    label: "پزشک انتخاب‌شده",
  },
  {
    key: "salamax_booking_confirmation",
    label: "تأیید رزرو",
  },
];

function readStorageItems(): StorageItem[] {
  if (typeof window === "undefined") return [];

  return storageKeys.map((item) => {
    const rawValue = localStorage.getItem(item.key);

    let parsedValue: unknown = null;

    try {
      parsedValue = rawValue ? JSON.parse(rawValue) : null;
    } catch {
      parsedValue = rawValue;
    }

    return {
      key: item.key,
      label: item.label,
      value: parsedValue,
    };
  });
}

export default function DebugPage() {
  const [items, setItems] = useState<StorageItem[]>(() => readStorageItems());

  function refreshData() {
    setItems(readStorageItems());
  }

  function clearLocalStorageData() {
    storageKeys.forEach((item) => {
      localStorage.removeItem(item.key);
    });

    refreshData();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              داشبورد توسعه SALAMAX
            </h1>

            <p className="mt-3 max-w-3xl leading-8 text-gray-600">
              این صفحه فقط برای توسعه نسخه frontend-only sandbox است و روی
              جریان عادی برنامه اثری ندارد. داده‌ها فقط از localStorage خوانده
              می‌شوند.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={refreshData}
              className="rounded-xl bg-blue-900 px-5 py-3 text-white hover:bg-blue-800"
            >
              بروزرسانی داده‌ها
            </button>

            <button
              type="button"
              onClick={clearLocalStorageData}
              className="rounded-xl border border-red-300 px-5 py-3 text-red-700 hover:bg-red-50"
            >
              پاک کردن داده‌های مرورگر
            </button>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
          <h2 className="font-bold">میانبرهای توسعه</h2>
          <p className="mt-2 text-sm leading-7">
            این لینک‌ها برای تست دستی هستند و ممکن است مسیر طبیعی شروع از
            /intake را دور بزنند.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/intake"
              className="rounded-xl bg-blue-900 px-5 py-3 text-center text-white hover:bg-blue-800"
            >
              شروع از پیش‌ویزیت
            </Link>

            <Link
              href="/body-map"
              className="rounded-xl border border-yellow-300 px-5 py-3 text-center text-yellow-800 hover:bg-yellow-100"
            >
              میانبر توسعه: نقشه بدن
            </Link>

            <Link
              href="/summary"
              className="rounded-xl border border-teal-300 px-5 py-3 text-center text-teal-700 hover:bg-teal-50"
            >
              مشاهده خلاصه
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-5">
          <h2 className="text-2xl font-bold text-blue-900">
            داده‌های ذخیره‌شده در مرورگر
          </h2>

          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-gray-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">
                    {item.label}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    localStorage key: {item.key}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    item.value
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.value ? "داده موجود است" : "خالی"}
                </span>
              </div>

              <pre className="mt-4 max-h-[320px] overflow-auto rounded-xl bg-white p-4 text-left text-xs leading-6 text-gray-800">
                {JSON.stringify(item.value, null, 2)}
              </pre>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
