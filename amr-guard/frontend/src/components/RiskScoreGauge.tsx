// [SOLID: SRP & UI/UX Pro Max] Clean, Compact Clinical Risk Score Gauge
"use client";

import React, { useId } from "react";
import { AuditTriageBand, PenaltiesBreakdown } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert
} from "lucide-react";

interface RiskScoreGaugeProps {
  score: number; // 0.0 to 100.0 (0 = Lowest Risk / Safe, 100 = Critical Risk / Blocked)
  band: AuditTriageBand;
  penalties?: PenaltiesBreakdown;
  status: "APPROVED" | "FLAGGED" | "BLOCKED" | "OVERRIDDEN";
  latencyMs?: number;
}

export function RiskScoreGauge({
  score,
  band,
  status,
  latencyMs,
}: RiskScoreGaugeProps) {
  const gradientId = useId();
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Clinician-friendly color schemes based on triage band
  const bandConfig = {
    GREEN: {
      color: "#169781",
      gradientStart: "#10B981",
      gradientEnd: "#169781",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      statusLabel: "Safe & Approved",
      riskTitle: "Low Antimicrobial Risk",
      description: "Adheres to first-line Access antimicrobials and standard ICMR clinical durations.",
      icon: ShieldCheck,
    },
    AMBER: {
      color: "#D97706",
      gradientStart: "#FBBF24",
      gradientEnd: "#D97706",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
      statusLabel: "Review Required",
      riskTitle: "Moderate Risk • Stewardship Flag",
      description: "Watch-tier escalation or duration anomaly flagged for clinical review.",
      icon: AlertTriangle,
    },
    RED: {
      color: "#DC2626",
      gradientStart: "#F87171",
      gradientEnd: "#DC2626",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200/80",
      statusLabel: "Prescription Blocked",
      riskTitle: "Critical Risk • High Alert",
      description: "Severe clinical contraindication or banned combination intercepted.",
      icon: ShieldAlert,
    },
  }[band] || {
    color: "#169781",
    gradientStart: "#10B981",
    gradientEnd: "#169781",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    statusLabel: status,
    riskTitle: "Clinical Safety Assessment",
    description: "Evaluating against national clinical stewardship guidelines.",
    icon: ShieldCheck,
  };

  const IconComponent = bandConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
      {/* Subtle modern ambient tint */}
      <div 
        className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-8 pointer-events-none"
        style={{ backgroundColor: bandConfig.color }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Clinical Safety Assessment
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[#0D607B] tracking-tight">
            Antimicrobial Risk Level
          </h3>
        </div>

        <Badge variant="outline" className={`gap-1.5 font-semibold text-xs px-2.5 py-0.5 rounded-full ${bandConfig.badgeClass}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{bandConfig.statusLabel}</span>
        </Badge>
      </div>

      {/* Compact Body: Gauge + Clinical Summary */}
      <div className="flex items-center gap-5 py-3.5">
        {/* Radial Animated Gauge */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={bandConfig.gradientStart} />
                <stop offset="100%" stopColor={bandConfig.gradientEnd} />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#F1F5F9"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Active Progress Arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* In-gauge score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="flex items-baseline justify-center">
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {score.toFixed(0)}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 ml-0.5">/100</span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Risk Score
            </span>
          </div>
        </div>

        {/* Clinical Assessment Summary */}
        <div className="space-y-1 flex-1">
          <div className="text-sm font-bold text-slate-800">{bandConfig.riskTitle}</div>
          <p className="text-xs text-slate-500 leading-relaxed">{bandConfig.description}</p>
        </div>
      </div>

      {/* Clean Footer Citation */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
          <span>ICMR Standard Treatment Guidelines &amp; WHO AWaRe</span>
        </span>
        {latencyMs !== undefined && latencyMs > 0 && (
          <span className="text-[10px] text-slate-400 font-medium">
            Evaluated in {latencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
}
