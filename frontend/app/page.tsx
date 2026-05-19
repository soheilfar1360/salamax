"use client";

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
    <main className="relative min-h-screen overflow-hidden bg-[#F6FBFC] text-[#183B56]">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute right-[-120px] top-[-120px] h-[360px] w-[360px] rounded-full bg-[#20C9C3]/20 blur-3xl"
      />

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="absolute bottom-[-160px] left-[-160px] h-[420px] w-[420px] rounded-full bg-[#20C9C3]/15 blur-3xl"
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
            className="text-sm font-semibold tracking-wide text-[#0E8F8A]"
          >
            Smart Healthcare AI Platform
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="mt-5 text-5xl font-bold leading-tight text-[#102A43] md:text-6xl"
          >
            هوشمندی برای تجربه‌ای بهتر از درمان
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3 }}
            className="mt-6 max-w-xl leading-8 text-[#64748B]"
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
              className="rounded-2xl bg-[#20C9C3] px-6 py-3 text-center font-bold text-[#061923] shadow-sm transition hover:bg-[#0E8F8A] hover:text-white"
            >
              شروع پیش‌ویزیت
            </Link>

            <Link
              href="/summary"
              className="rounded-2xl border border-[#D7ECEF] bg-white px-6 py-3 text-center font-bold text-[#183B56] shadow-sm transition hover:bg-[#EAFBF8]"
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
            <div className="rounded-2xl border border-[#D7ECEF] bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-[#102A43]">AI</p>
              <p className="mt-1 text-sm text-[#64748B]">پیش‌ویزیت هوشمند</p>
            </div>

            <div className="rounded-2xl border border-[#D7ECEF] bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-[#102A43]">4</p>
              <p className="mt-1 text-sm text-[#64748B]">درجه هشدار</p>
            </div>

            <div className="rounded-2xl border border-[#D7ECEF] bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-[#102A43]">Sandbox</p>
              <p className="mt-1 text-sm text-[#64748B]">نسخه تست محصول</p>
            </div>
          </motion.div>

          <p className="mt-8 text-sm text-[#64748B]">
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
            className="absolute inset-0 rounded-full bg-[#20C9C3]/25 blur-3xl"
          />

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.025 }}
            className="relative rounded-[2rem] border border-[#D7ECEF] bg-white p-8 shadow-xl"
          >
            <motion.div
              initial={{ opacity: 0, rotate: -2, scale: 0.94 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              whileHover={{ scale: 1.04 }}
            >
              <video
                src="/videos/salamax-owl-intro.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                preload="auto"
                className="mx-auto aspect-square w-full max-w-md object-contain"
              />
              <p className="mt-4 text-center text-xs tracking-[0.25em] text-[#94A3B8]">
                created by Soheil Faramarzi
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.75 }}
              className="mt-8 rounded-2xl border border-[#20C9C3] bg-[#EAFBF8] p-5"
            >
              <h2 className="font-bold text-[#102A43]">مسیر هوشمند درمان</h2>

              <div className="mt-4 grid gap-3 text-sm text-[#183B56]">
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
                    className="rounded-xl border border-[#D7ECEF] bg-white p-3 shadow-sm"
                  >
                    <span className="font-bold text-[#0E8F8A]">
                      {index + 1}.
                    </span>{" "}
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-[#D7ECEF] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-[#0E8F8A]">How it works</p>

              <h2 className="mt-2 text-3xl font-bold text-[#102A43]">
                مسیر آرام و مرحله‌به‌مرحله تا انتخاب پزشک
              </h2>
            </div>

            <p className="max-w-2xl leading-8 text-[#64748B]">
              ابتدا شرح حال یا هدف مراجعه ثبت می‌شود؛ اگر درد موضعی وجود داشته
              باشد، نقشه بدن نمایش داده می‌شود. سپس مدارک اختیاری، تحلیل اولیه،
              اولویت ویزیت و انتخاب پزشک انجام می‌شود.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-3xl border border-[#D7ECEF] bg-[#F6FBFC] p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#20C9C3] text-sm font-bold text-[#061923]">
                  {index + 1}
                </span>

                <p className="mt-4 text-sm leading-7 text-[#183B56]">{step}</p>
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
                className="rounded-3xl border border-[#D7ECEF] bg-gradient-to-br from-[#EAFBF8] to-white p-6 shadow-sm"
              >
                <h3 className="font-bold text-[#102A43]">{card.title}</h3>

                <p className="mt-3 text-sm leading-7 text-[#64748B]">
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
