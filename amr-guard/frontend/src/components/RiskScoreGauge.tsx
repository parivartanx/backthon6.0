// [SOLID: SRP] Animated Circular AMR Risk Score Gauge for AMR Sentinel Clinical Decision Support
"use client";

import React, { useId } from "react";
import { AuditTriageBand, PenaltiesBreakdown } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";

interface RiskScoreGaugeProps {
  score: number; // 0.0 to 100.0
  band: AuditTriageBand;
  penalties?: PenaltiesBreakdown;
  status: "APPROVED" | "FLAGGED" | "BLOCKED";
  latencyMs?: number;
}

export function RiskScoreGauge({
  score,
  band,
  penalties = { p_class: 0, p_duration: 0, p_indication: 0 },
  status,
  latencyMs = 3,
}: RiskScoreGaugeProps) {
  const gradientId = useId();
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  // Bounded percentage
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Visual theming based on Band
  const bandConfig = {
    GREEN: {
      color: "#169781",
      gradientStart: "#10B981",
      gradientEnd: "#169781",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
      label: "Low Risk • Stewardship Compliant",
      icon: ShieldCheck,
      description: "Adheres to first-line Access antimicrobials and recommended clinical durations.",
    },
    AMBER: {
      color: "#F59E0B",
      gradientStart: "#FBBF24",
      gradientEnd: "#D97706",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
      label: "Review Required • Escalation Detected",
      icon: AlertTriangle,
      description: "Watch-tier escalation or duration anomaly requires physician re-evaluation.",
    },
    RED: {
      color: "#EF4444",
      gradientStart: "#F87171",
      gradientEnd: "#DC2626",
      badgeBg: "bg-rose-50 text-rose-800 border-rose-300",
      label: "Critical Alert • Prescription Blocked",
      icon: ShieldAlert,
      description: "Severe clinical contraindication or banned drug combination detected.",
    },
  }[band] || {
    color: "#169781",
    gradientStart: "#10B981",
    gradientEnd: "#169781",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
    label: "Evaluating",
    icon: ShieldCheck,
    description: "",
  };

  const IconComponent = bandConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
      {/* Subtle background glow */}
      <div 
        className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: bandConfig.color }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Deterministic Engine
          </span>
          <h3 className="text-sm font-bold text-[#0D607B]">AMR Sentinel Risk Index</h3>
        </div>
        <Badge variant="outline" className={`gap-1 font-semibold text-[11px] ${bandConfig.badgeBg}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{status}</span>
        </Badge>
      </div>

      {/* Center: Radial Animated Gauge */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 180 180">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={bandConfig.gradientStart} />
                <stop offset="100%" stopColor={bandConfig.gradientEnd} />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Animated progress arc */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text in circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold tracking-tight text-slate-800">
              {score.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Score / 100
            </span>
            <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded mt-1">
              {latencyMs}ms execution
            </span>
          </div>
        </div>

        {/* Mathematical Penalty Breakdown Pill Grid */}
        <div className="flex-1 space-y-2.5 w-full">
          <div>
            <div className="text-xs font-bold text-slate-700">{bandConfig.label}</div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{bandConfig.description}</p>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Mathematical Weight Breakdown:
            </div>

            {/* Formula display */}
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-600 space-y-1">
              <div className="flex justify-between items-center">
                <span>0.4 × P_class (AWaRe):</span>
                <span className="font-bold text-slate-800">
                  {(0.4 * (penalties.p_class || 0)).toFixed(1)} pts
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>0.2 × P_duration (Days):</span>
                <span className="font-bold text-slate-800">
                  {(0.2 * (penalties.p_duration || 0)).toFixed(1)} pts
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>0.4 × P_indication (Syndrome):</span>
                <span className="font-bold text-slate-800">
                  {(0.4 * (penalties.p_indication || 0)).toFixed(1)} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#169781]" />
          <span>ICMR STG / WHO AWaRe 2023 Rules</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">Zero-LLM Latency Gate</span>
      </div>
    </div>
  );
}
