"use client";

import { Check, Edit3, ClipboardCheck } from "lucide-react";

export type WorkflowStepNumber = 1 | 2 | 3;

interface WorkflowStepperProps {
  currentStep: WorkflowStepNumber;
}

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  const steps = [
    { number: 1, label: "Input Prescription", icon: Edit3 },
    { number: 2, label: "Verify Details", icon: ClipboardCheck },
    { number: 3, label: "Ready for Audit", icon: Check },
  ];

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 mb-6 shadow-2xs">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Connecting track */}
        <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-[#169781] transition-all duration-300 -z-0"
          style={{
            width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className="flex flex-col items-center relative z-10 select-none"
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                  isCompleted
                    ? "bg-[#169781] text-white ring-4 ring-[#E2FAD9]"
                    : isActive
                    ? "bg-[#0D607B] text-white ring-4 ring-[#C9E9EB]"
                    : "bg-white text-slate-400 border-2 border-slate-300"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center ${
                  isActive
                    ? "text-[#0D607B] font-bold"
                    : isCompleted
                    ? "text-[#169781] font-semibold"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
