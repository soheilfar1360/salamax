"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const steps = [
  "ثبت هدف مراجعه یا شرح حال",
  "در صورت وجود درد، انتخاب محل درد روی مدل بدن",
  "آپلود اختیاری مدارک پزشکی",
  "تحلیل اولیه و پیشنهاد پزشک",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-teal-50">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute right-[-120px] top-[-120px] h-[360px] w-[360px] rounded-full bg-teal-300/20 blur-3xl"
      />

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="absolute bottom-[-160px] left-[-160px] h-[420px] w-[420px] rounded-full bg-blue-300/20 blur-3xl"
      />

      <section className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <motion.div
          initial={{ opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-sm font-semibold tracking-wide text-teal-700"
          >
            Smart Healthcare AI Platform
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="mt-5 text-5xl font-bold leading-tight text-blue-950 md:text-6xl"
          >
            هوشمندی برای تجربه‌ای بهتر از درمان
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3 }}
            className="mt-6 max-w-xl leading-8 text-gray-600"
          >
            SALAMAX یک سامانه هوشمند پیش‌ویزیت و نوبت‌دهی پزشکی است که ابتدا هدف
            مراجعه یا شرح حال را دریافت می‌کند و سپس بر اساس نوع نیاز، مسیر مناسب
            را پیشنهاد می‌دهد. نقشه بدن فقط زمانی نمایش داده می‌شود که کاربر درد
            یا ناراحتی موضعی گزارش کند.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.45 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/intake"
            className="rounded-2xl bg-blue-950 px-6 py-3 text-center text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-900"
            >
              شروع پیش‌ویزیت
            </Link>

            <Link
              href="/summary"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center text-slate-700 shadow-sm transition hover:border-teal-400 hover:text-teal-700"
            >
              مشاهده خلاصه دمو
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.6 }}
            className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3"
          >
            <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-2xl font-bold text-blue-950">AI</p>
              <p className="mt-1 text-sm text-gray-500">پیش‌ویزیت هوشمند</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-2xl font-bold text-blue-950">4</p>
              <p className="mt-1 text-sm text-gray-500">درجه هشدار</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-2xl font-bold text-blue-950">Sandbox</p>
              <p className="mt-1 text-sm text-gray-500">نسخه تست محصول</p>
            </div>
          </motion.div>

          <p className="mt-8 text-sm text-gray-500">
            این سامانه تشخیص قطعی پزشکی ارائه نمی‌دهد و صرفاً برای راهنمایی اولیه
            و هدایت مسیر مراجعه طراحی شده است.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 36 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.22, 0.42, 0.22],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-teal-300/30 blur-3xl"
          />

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.025 }}
            className="relative rounded-[2rem] border border-white bg-white/80 p-8 shadow-2xl backdrop-blur"
          >
            <motion.div
              initial={{ opacity: 0, rotate: -2, scale: 0.94 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              whileHover={{ scale: 1.04 }}
            >
              <Image
                src="/salamax-logo.png"
                alt="SALAMAX Logo"
                width={700}
                height={700}
                priority
                className="mx-auto h-auto w-full max-w-md"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.75 }}
              className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/80 p-5"
            >
              <h2 className="font-bold text-blue-950">
                مسیر هوشمند درمان
              </h2>

              <div className="mt-4 grid gap-3 text-sm text-gray-700">
                {steps.map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.9 + index * 0.12,
                    }}
                    whileHover={{ x: -5 }}
                    className="rounded-xl bg-white p-3 shadow-sm"
                  >
                    {index + 1}. {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="mt-6 text-center text-xs tracking-[0.25em] text-gray-400"
            >
              Powered by Soheil Faramarzi
            </motion.p>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur sm:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-teal-700">How it works</p>
              <h2 className="mt-2 text-3xl font-bold text-blue-950">
                مسیر آرام و مرحله‌به‌مرحله تا انتخاب پزشک
              </h2>
            </div>
            <p className="max-w-2xl leading-8 text-slate-600">
              ابتدا شرح حال یا هدف مراجعه ثبت می‌شود؛ اگر درد موضعی وجود داشته
              باشد، نقشه بدن نمایش داده می‌شود. سپس مدارک اختیاری، تحلیل اولیه،
              اولویت ویزیت و انتخاب پزشک انجام می‌شود.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-950 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm leading-7 text-slate-700">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "پیش‌ویزیت هوشمند",
                text: "شرح حال اولیه به زبان ساده دریافت و مسیر مناسب پیشنهاد می‌شود.",
              },
              {
                title: "هدایت به مسیر مناسب درمان",
                text: "نقشه بدن فقط برای درد موضعی استفاده می‌شود و مسیر عمومی جداست.",
              },
              {
                title: "خلاصه قابل ارسال به پزشک",
                text: "خلاصه نهایی شامل شرح حال، مدارک، نتایج، اولویت‌ها و رزرو است.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm"
              >
                <h3 className="font-bold text-blue-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
