"use client";

import React from "react";
import { Check } from "lucide-react";

export type WorkflowStepNumber = 1 | 2 | 3;

interface Step {
  number: WorkflowStepNumber;
  label: string;
}

interface WorkflowStepperProps {
  currentStep: WorkflowStepNumber;
}

const STEPS: Step[] = [
  { number: 1, label: "Prescription Intake" },
  { number: 2, label: "Medication Review" },
  { number: 3, label: "Prescription Safety Check" },
];

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  return (
    <div className="w-full px-2 py-2 mb-6">
      {/* Step Labels Row */}
      <div className="flex items-start mb-4">
        {STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <React.Fragment key={step.number}>
              {/* Label column — takes fixed width, centered */}
              <div className="flex flex-col items-center" style={{ minWidth: 96 }}>
                <span
                  className={`text-xs font-semibold text-center leading-tight ${isActive
                      ? "text-[#0D607B]"
                      : isCompleted
                        ? "text-slate-600"
                        : "text-slate-400"
                    }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Spacer between labels */}
              {idx < STEPS.length - 1 && <div className="flex-1" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Circles + Lines Row */}
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <React.Fragment key={step.number}>
              {/* Step Circle */}
              <div className="flex-none flex justify-center" style={{ minWidth: 96 }}>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${isCompleted
                      ? "bg-[#0D607B] text-white shadow-sm"
                      : isActive
                        ? "bg-white border-[3px] border-[#0D607B] text-[#0D607B]"
                        : "bg-white border-2 border-slate-300 text-slate-400"
                    }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-[3px] mx-0 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${step.number < currentStep ? "w-full bg-[#0D607B]" : "w-0"
                      }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
