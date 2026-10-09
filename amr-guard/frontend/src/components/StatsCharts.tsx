// [SOLID: SRP] Clinical Antimicrobial Stewardship Analytics Charts for AMR Sentinel
"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart as PieIcon, BarChart3, ShieldCheck } from "lucide-react";
import { BackendAWaReDistribution } from "@/types/prescription";

const DEFAULT_AWARE_DATA = [
  { name: "Access (First-Line)", value: 58, color: "#169781" },
  { name: "Watch (High Risk)", value: 34, color: "#F59E0B" },
  { name: "Reserve (Last Resort)", value: 8, color: "#EF4444" },
];

const WEEKLY_AUDIT_DATA = [
  { day: "Mon", approved: 22, flagged: 6, blocked: 2 },
  { day: "Tue", approved: 26, flagged: 8, blocked: 3 },
  { day: "Wed", approved: 31, flagged: 5, blocked: 1 },
  { day: "Thu", approved: 28, flagged: 7, blocked: 2 },
  { day: "Fri", approved: 35, flagged: 9, blocked: 4 },
  { day: "Sat", approved: 19, flagged: 4, blocked: 1 },
];

interface StatsChartsProps {
  awareDistribution?: BackendAWaReDistribution;
}

export function StatsCharts({ awareDistribution }: StatsChartsProps) {
  const awareData = awareDistribution
    ? [
        { name: "Access (First-Line)", value: Math.round(awareDistribution.access_pct), color: "#169781" },
        { name: "Watch (High Risk)", value: Math.round(awareDistribution.watch_pct), color: "#F59E0B" },
        { name: "Reserve (Last Resort)", value: Math.round(awareDistribution.reserve_pct), color: "#EF4444" },
      ]
    : DEFAULT_AWARE_DATA;

  const accessPct = awareDistribution ? Math.round(awareDistribution.access_pct) : 58;
  const isTargetMet = awareDistribution ? awareDistribution.who_target_met : accessPct >= 60;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: WHO AWaRe Spectrum Distribution */}
      <Card className="bg-white border-slate-200/90 shadow-2xs">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E2FAD9] flex items-center justify-center text-[#169781]">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-[#0D607B]">
                  WHO AWaRe Prescribing Distribution
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                  Target: ≥60% Access-tier antimicrobials across outpatient care
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold ${
                isTargetMet
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-amber-50 text-amber-700 border-amber-300"
              }`}
            >
              {accessPct}% Access {isTargetMet ? "(Target Met)" : "(Below Target)"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={awareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {awareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: unknown) => [`${val}%`, "Proportion"]}
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#FFF",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Weekly Triage Outcomes */}
      <Card className="bg-white border-slate-200/90 shadow-2xs">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F1F8FC] flex items-center justify-center text-[#0D607B]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-[#0D607B]">
                  Weekly Antimicrobial Triage Volume
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                  Five-Tier engine outcomes: Approved, Review Flagged, and Hard Blocked
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-[#F1F8FC] text-[#0D607B] border-[#C9E9EB] font-semibold">
              Live Stream
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_AUDIT_DATA}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#FFF",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-600 capitalize">
                      {value}
                    </span>
                  )}
                />
                <Bar dataKey="approved" name="Approved" fill="#169781" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="flagged" name="Review Required" fill="#F59E0B" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="blocked" name="Blocked (Tier 1)" fill="#EF4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
