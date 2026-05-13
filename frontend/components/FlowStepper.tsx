type FlowStep =
  | "intake"
  | "route"
  | "documents"
  | "analysis"
  | "preference"
  | "doctor"
  | "booking"
  | "summary";

type FlowStepperProps = {
  currentStep: FlowStep;
};

const steps: Array<{ key: FlowStep; label: string }> = [
  { key: "intake", label: "شرح حال" },
  { key: "route", label: "مسیر مراجعه" },
  { key: "documents", label: "مدارک" },
  { key: "analysis", label: "تحلیل" },
  { key: "preference", label: "اولویت ویزیت" },
  { key: "doctor", label: "پزشک" },
  { key: "booking", label: "رزرو" },
  { key: "summary", label: "خلاصه" },
];

export default function FlowStepper({ currentStep }: FlowStepperProps) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <nav
      aria-label="مسیر پیش‌ویزیت"
      className="salamax-card salamax-scroll-x mb-6 max-w-full overflow-x-auto rounded-3xl p-3 shadow-sm"
      dir="rtl"
    >
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-[rgba(39,214,208,0.7)] bg-[rgba(39,214,208,0.1)] text-[#F4F7F8] shadow-sm"
                    : isComplete
                    ? "border-[rgba(14,167,163,0.6)] bg-[rgba(14,167,163,0.12)] text-[#F4F7F8]"
                    : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[#9FB3B7]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isComplete
                      ? "bg-[#0EA7A3] text-[#061923]"
                      : isActive
                      ? "bg-[#27D6D0] text-[#061923]"
                      : "bg-[rgba(255,255,255,0.08)] text-[#9FB3B7]"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span
                  className="h-px w-5 bg-[rgba(255,255,255,0.16)]"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
