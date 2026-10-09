// [SOLID: SRP] Modern Responsive Clinical Workflow Stepper for AMR Sentinel
"use client";

import { Check, Edit3, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type WorkflowStepNumber = 1 | 2 | 3;

interface WorkflowStepperProps {
  currentStep: WorkflowStepNumber;
}

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  const steps = [
    {
      number: 1,
      title: "Clinical Regimen Entry",
      subtitle: "Digitize OPD slip & context",
      icon: Edit3,
    },
    {
      number: 2,
      title: "Medication Review",
      subtitle: "Verify extracted entities",
      icon: ClipboardCheck,
    },
    {
      number: 3,
      title: "5-Tier AMR Audit",
      subtitle: "ICMR & WHO compliance",
      icon: ShieldCheck,
    },
  ];

  const progressPercent = currentStep === 1 ? 16 : currentStep === 2 ? 65 : 100;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
      {/* Top Meta Track */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Verification Pipeline
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-semibold text-[#0D607B]">
            Step {currentStep} of 3
          </span>
        </div>

        <Badge
          variant="outline"
          className={`text-[10px] font-semibold px-2 py-0.5 ${
            currentStep === 3
              ? "bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/40"
              : "bg-[#F1F8FC] text-[#0D607B] border-[#C9E9EB]"
          }`}
        >
          {currentStep === 1
            ? "Phase 1: Regimen Intake"
            : currentStep === 2
            ? "Phase 2: Entity Verification"
            : "Phase 3: 5-Tier Audit Engine"}
        </Badge>
      </div>

      {/* Segmented Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className={`p-3 rounded-xl border transition-all duration-300 relative flex items-center gap-3 ${
                isActive
                  ? "bg-[#F1F8FC] border-[#169781] shadow-xs ring-1 ring-[#169781]/30"
                  : isCompleted
                  ? "bg-slate-50/70 border-slate-200 text-slate-700"
                  : "bg-white border-slate-200/60 opacity-60 text-slate-400"
              }`}
            >
              {/* Step Icon Badge */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                  isActive
                    ? "bg-[#0D607B] text-white shadow-xs scale-105"
                    : isCompleted
                    ? "bg-[#169781] text-white"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Step Copy */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive
                        ? "text-[#0D607B]"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block truncate">
                  {step.subtitle}
                </span>
              </div>

              {/* Active Indicator Pulse */}
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-[#169781] shrink-0 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Animated Bottom Progress Line */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#0D607B] to-[#169781] h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
