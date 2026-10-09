// [SOLID: SRP] FlagCard component for AMR Sentinel Five-Tier Rule Violations
"use client";

import React, { useState } from "react";
import { RuleViolation, RuleSeverity } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  ArrowRight,
  ShieldBan
} from "lucide-react";

interface FlagCardProps {
  violation: RuleViolation;
  onApplyRemediation?: (remediationText: string) => void;
}

export function FlagCard({ violation, onApplyRemediation }: FlagCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Severity visual mapping
  const severityConfig: Record<
    RuleSeverity,
    {
      badgeClass: string;
      cardBorder: string;
      cardBg: string;
      icon: typeof AlertOctagon;
      iconColor: string;
    }
  > = {
    BLOCKED: {
      badgeClass: "bg-red-100 text-red-900 border-red-300 font-bold",
      cardBorder: "border-red-200 hover:border-red-300",
      cardBg: "bg-red-50/40",
      icon: ShieldBan,
      iconColor: "text-red-600",
    },
    HIGH: {
      badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
      cardBorder: "border-rose-200 hover:border-rose-300",
      cardBg: "bg-rose-50/30",
      icon: AlertOctagon,
      iconColor: "text-rose-600",
    },
    MEDIUM: {
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-semibold",
      cardBorder: "border-amber-200 hover:border-amber-300",
      cardBg: "bg-amber-50/20",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
    },
    LOW: {
      badgeClass: "bg-slate-100 text-slate-800 border-slate-300 font-medium",
      cardBorder: "border-slate-200 hover:border-slate-300",
      cardBg: "bg-slate-50/40",
      icon: Info,
      iconColor: "text-slate-500",
    },
  };

  const config = severityConfig[violation.severity] || severityConfig.MEDIUM;
  const Icon = config.icon;

  const tierLabels: Record<number, string> = {
    1: "Tier 1: Hard Contraindication (Zero Tolerance)",
    2: "Tier 2: Indication Appropriateness",
    3: "Tier 3: WHO AWaRe Classification",
    4: "Tier 4: Dosing & Course Duration",
    5: "Tier 5: Local AMR Resistance & Culture",
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 shadow-2xs overflow-hidden ${config.cardBorder} ${config.cardBg}`}
    >
      <div className="p-4 space-y-2.5">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className={`p-1.5 rounded-lg bg-white shadow-2xs border border-slate-100 shrink-0 mt-0.5 ${config.iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <Badge variant="outline" className={`text-[10px] px-2 py-0.2 ${config.badgeClass}`}>
                  {violation.severity}
                </Badge>
                <span className="text-[10px] font-semibold text-slate-400">
                  {tierLabels[violation.tier] || `Tier ${violation.tier}`}
                </span>
                {violation.penalty_score > 0 && (
                  <span className="text-[10px] font-mono font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                    +{violation.penalty_score.toFixed(0)} penalty pts
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                {violation.rule_name}
              </h4>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-700 h-7 w-7 p-0 shrink-0"
            aria-label={isExpanded ? "Collapse rule details" : "Expand rule details"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Drug mention if any */}
        {violation.drug && (
          <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5 pl-9">
            <span className="text-slate-400">Flagged Molecule:</span>
            <span className="font-semibold text-[#0D607B] bg-white px-2 py-0.5 rounded border border-slate-200">
              {violation.drug}
            </span>
          </div>
        )}

        {/* Rationale snippet */}
        <p className="text-xs text-slate-600 pl-9 leading-relaxed">
          {violation.rationale}
        </p>

        {/* Expandable details: Remediation & Citation */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 pl-9 space-y-2.5">
            {violation.remediation && (
              <div className="p-3 bg-white rounded-lg border border-[#169781]/20 space-y-1">
                <span className="text-[10px] font-bold text-[#169781] uppercase tracking-wider block">
                  Recommended Safety Action:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {violation.remediation}
                </p>
                {onApplyRemediation && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onApplyRemediation(violation.remediation!)}
                    className="mt-2 h-7 text-[11px] gap-1 bg-[#169781] hover:bg-[#117866] text-white"
                  >
                    <span>Adopt Intervention</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}

            {violation.citation && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[10px]">Citation: {violation.citation}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
