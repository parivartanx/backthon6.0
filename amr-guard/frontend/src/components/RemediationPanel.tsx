// [SOLID: SRP] RemediationPanel component for AMR Sentinel Actionable Clinical Interventions
"use client";

import React from "react";
import { RemediationOption } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  RefreshCw, 
  Ban, 
  Clock, 
  Stethoscope, 
  FlaskConical, 
  BookOpen,
  ArrowRight
} from "lucide-react";

interface RemediationPanelProps {
  options: RemediationOption[];
  onApply?: (option: RemediationOption) => void;
}

export function RemediationPanel({ options, onApply }: RemediationPanelProps) {
  if (!options || options.length === 0) {
    return (
      <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-emerald-900">Full Guideline Compliance</h4>
        <p className="text-[11px] text-emerald-700 max-w-sm mx-auto">
          Zero interventions required. Prescription strictly complies with first-line ICMR guidelines and recommended course durations.
        </p>
      </div>
    );
  }

  const typeConfig: Record<
    string,
    { label: string; icon: typeof RefreshCw; badgeClass: string }
  > = {
    SWITCH_DRUG: {
      label: "De-escalate / Switch Agent",
      icon: RefreshCw,
      badgeClass: "bg-blue-100 text-blue-900 border-blue-200",
    },
    DISCONTINUE: {
      label: "Discontinue Antimicrobial",
      icon: Ban,
      badgeClass: "bg-red-100 text-red-900 border-red-200",
    },
    REDUCE_DURATION: {
      label: "Reduce Course Duration",
      icon: Clock,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    },
    MANDATE_SYMPTOMATIC: {
      label: "Supportive Symptomatic Care",
      icon: Stethoscope,
      badgeClass: "bg-teal-100 text-teal-900 border-teal-200",
    },
    MICROBIOLOGY_REQUIRED: {
      label: "Microbiology ID Mandated",
      icon: FlaskConical,
      badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    },
    CONTRAINDICATION_BLOCK: {
      label: "Emergency Halt / Block",
      icon: Ban,
      badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#0D607B] uppercase tracking-wider">
            Clinical Safety Recommendations
          </h3>
          <p className="text-[11px] text-slate-500">
            Actionable recommendations to improve prescription safety and guidelines adherence
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
          {options.length} {options.length === 1 ? "Option" : "Options"} Available
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, idx) => {
          const cfg = typeConfig[opt.recommendation_type] || {
            label: opt.recommendation_type,
            icon: Stethoscope,
            badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
          };
          const Icon = cfg.icon;

          return (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#169781]/50 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={`gap-1 text-[10px] px-2 py-0.5 font-bold ${cfg.badgeClass}`}>
                    <Icon className="w-3 h-3" />
                    <span>{cfg.label}</span>
                  </Badge>
                  {opt.source_citation && (
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                      {opt.source_citation}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {opt.guidance}
                </p>

                {(opt.suggested_drug || opt.suggested_duration_days) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {opt.suggested_drug && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F8FC] border border-[#C9E9EB] text-[#0D607B] font-semibold">
                        <span className="text-slate-400 text-[10px] font-normal">Alternative:</span>
                        <span>{opt.suggested_drug}</span>
                      </div>
                    )}
                    {opt.suggested_duration_days && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Recommended: {opt.suggested_duration_days} Days</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {onApply && (
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onApply(opt)}
                    className="h-7 text-xs gap-1.5 bg-[#169781] hover:bg-[#117866] text-white font-semibold"
                  >
                    <span>Accept Recommendation</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
