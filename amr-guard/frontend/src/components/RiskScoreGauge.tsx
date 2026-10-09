// [SOLID: SRP] Clinical Antimicrobial Risk Gauge for AMR Sentinel Clinical Decision Support
"use client";

import React, { useId, useState } from "react";
import { AuditTriageBand, PenaltiesBreakdown } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Pill, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
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
  penalties = { p_class: 0, p_duration: 0, p_indication: 0 },
  status,
  latencyMs,
}: RiskScoreGaugeProps) {
  const gradientId = useId();
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const [showTechnicalMath, setShowTechnicalMath] = useState(false);

  // Clinician-friendly UI themes based on triage band
  const bandConfig = {
    GREEN: {
      color: "#169781",
      gradientStart: "#10B981",
      gradientEnd: "#169781",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
      statusLabel: "Safe & Approved",
      riskTier: "Low Antimicrobial Risk",
      icon: ShieldCheck,
      description: "Adheres to first-line Access antimicrobials and recommended clinical durations.",
    },
    AMBER: {
      color: "#F59E0B",
      gradientStart: "#FBBF24",
      gradientEnd: "#D97706",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
      statusLabel: "Needs Doctor Review",
      riskTier: "Moderate Risk • Stewardship Flag",
      icon: AlertTriangle,
      description: "Watch-tier escalation or duration anomaly requires physician review.",
    },
    RED: {
      color: "#EF4444",
      gradientStart: "#F87171",
      gradientEnd: "#DC2626",
      badgeBg: "bg-rose-50 text-rose-800 border-rose-300",
      statusLabel: "High Risk (Blocked)",
      riskTier: "Critical Risk • Prescription Blocked",
      icon: ShieldAlert,
      description: "Severe clinical contraindication or unauthorized drug combination intercepted.",
    },
  }[band] || {
    color: "#169781",
    gradientStart: "#10B981",
    gradientEnd: "#169781",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
    statusLabel: status,
    riskTier: "Evaluating Safety",
    icon: ShieldCheck,
    description: "Analyzing clinical guidelines...",
  };

  const IconComponent = bandConfig.icon;

  // Derive human clinical factors from penalties
  const hasClassPenalty = (penalties.p_class || 0) > 0;
  const hasDurationPenalty = (penalties.p_duration || 0) > 0;
  const hasIndicationPenalty = (penalties.p_indication || 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden h-full">
      {/* Subtle background glow */}
      <div 
        className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: bandConfig.color }}
      />

      {/* Header with clear clinician titles */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Clinical Safety Assessment
          </span>
          <h3 className="text-sm font-bold text-[#0D607B]">Antimicrobial Risk Level</h3>
        </div>
        <Badge variant="outline" className={`gap-1.5 font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${bandConfig.badgeBg}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{bandConfig.statusLabel}</span>
        </Badge>
      </div>

      {/* Center: Radial Animated Gauge + Clinical Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-40 h-40 -rotate-90 transform" viewBox="0 0 170 170">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={bandConfig.gradientStart} />
                <stop offset="100%" stopColor={bandConfig.gradientEnd} />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="85"
              cy="85"
              r={radius}
              stroke="#F1F5F9"
              strokeWidth="11"
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Animated progress arc */}
            <circle
              cx="85"
              cy="85"
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth="11"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text in circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
              {score.toFixed(0)}
              <span className="text-xs font-semibold text-slate-400 font-sans ml-0.5">/100</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Risk Score
            </span>
            {latencyMs !== undefined && latencyMs > 0 ? (
              <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-1">
                {latencyMs}ms check
              </span>
            ) : (
              <span className="text-[9px] font-medium text-[#169781] bg-[#E2FAD9] px-1.5 py-0.2 rounded mt-1">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Doctor-Friendly Clinical Risk Factors Breakdown */}
        <div className="flex-1 space-y-2.5 w-full">
          <div>
            <div className="text-xs font-bold text-slate-800">{bandConfig.riskTier}</div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{bandConfig.description}</p>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Key Safety Factors:
              </span>
              <button
                type="button"
                onClick={() => setShowTechnicalMath(!showTechnicalMath)}
                className="text-[10px] text-[#0D607B] hover:underline font-medium"
              >
                {showTechnicalMath ? "Hide details" : "Technical details"}
              </button>
            </div>

            {/* Doctor-friendly risk factor pills */}
            <div className="space-y-1.5">
              {/* Factor 1: Antibiotic Class */}
              <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Pill className="w-3.5 h-3.5 text-slate-500" />
                  <span>WHO AWaRe Class</span>
                </span>
                {hasClassPenalty ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Watch / Escalated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    First-Line Access
                  </span>
                )}
              </div>

              {/* Factor 2: Duration */}
              <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Course Duration</span>
                </span>
                {hasDurationPenalty ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Extended Duration
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Guideline Duration
                  </span>
                )}
              </div>

              {/* Factor 3: Clinical Fit */}
              <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clinical Indication</span>
                </span>
                {hasIndicationPenalty ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Contraindicated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Indication Verified
                  </span>
                )}
              </div>
            </div>

            {/* Optional Collapsed Technical Details */}
            {showTechnicalMath && (
              <div className="p-2 bg-slate-100/80 rounded-lg text-[10px] font-mono text-slate-600 space-y-1 mt-1 border border-slate-200">
                <div className="flex justify-between">
                  <span>Class Penalty (AWaRe):</span>
                  <span className="font-bold text-slate-800">{(0.4 * (penalties.p_class || 0)).toFixed(1)} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration Penalty:</span>
                  <span className="font-bold text-slate-800">{(0.2 * (penalties.p_duration || 0)).toFixed(1)} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Indication Penalty:</span>
                  <span className="font-bold text-slate-800">{(0.4 * (penalties.p_indication || 0)).toFixed(1)} pts</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
          <span>ICMR STG &amp; WHO AWaRe Standards</span>
        </span>
        <span className="text-[10px] text-slate-400 font-medium">Real-Time Rule Engine</span>
      </div>
    </div>
  );
}
