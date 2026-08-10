"use client";

export interface StepItem {
  id: number;
  label: string;
}

const STEPS: StepItem[] = [
  { id: 1, label: "Wallet" },
  { id: 2, label: "Assets" },
  { id: 3, label: "AI Intent" },
  { id: 4, label: "Strategy" },
  { id: 5, label: "Route" },
  { id: 6, label: "Execution" },
];

export function StepTracker({ currentStep, onSelectStep }: { currentStep: number; onSelectStep?: (step: number) => void }) {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-4 shadow-glass">
      <div className="flex items-center justify-between gap-1 overflow-x-auto text-xs font-semibold">
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isNavigable = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!isNavigable}
                onClick={() => isNavigable && onSelectStep?.(step.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${
                  isCurrent
                    ? "bg-gradient-to-r from-accent to-accent2 text-white shadow-glow font-bold scale-105"
                    : isCompleted
                    ? "text-neutral-200 hover:text-white cursor-pointer hover:bg-white/10"
                    : "text-neutral-500 cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? "bg-white text-ink"
                      : isCompleted
                      ? "bg-success/20 text-success border border-success/40"
                      : "bg-white/5 text-neutral-500 border border-white/10"
                  }`}
                >
                  {isCompleted ? "✓" : step.id}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={`mx-1.5 h-0.5 flex-1 rounded-full transition-all ${
                    step.id < currentStep ? "bg-gradient-to-r from-accent to-accent2" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
