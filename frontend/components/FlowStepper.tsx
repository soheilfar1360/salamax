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
      className="mb-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-sm"
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
                    ? "border-teal-300 bg-teal-50 text-teal-900 shadow-sm"
                    : isComplete
                    ? "border-blue-200 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isComplete
                      ? "bg-blue-900 text-white"
                      : isActive
                      ? "bg-teal-600 text-white"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span className="h-px w-5 bg-slate-200" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
