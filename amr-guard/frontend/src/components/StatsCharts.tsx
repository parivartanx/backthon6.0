// [SOLID: SRP] Clinical Antimicrobial Stewardship Analytics Charts
// Clean, mature, non-overlapping charts using Shadcn UI chart container
"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart as PieIcon, BarChart3, CheckCircle2 } from "lucide-react";
import { BackendAWaReDistribution } from "@/types/prescription";

interface StatsChartsProps {
  awareDistribution?: BackendAWaReDistribution;
}

const DEFAULT_AWARE_DATA = [
  { name: "Access", label: "Access (Safe First-Line)", value: 58, fill: "#169781" },
  { name: "Watch", label: "Watch (Use with Caution)", value: 34, fill: "#F59E0B" },
  { name: "Reserve", label: "Reserve (Last-Resort Only)", value: 8, fill: "#EF4444" },
];

const WEEKLY_AUDIT_DATA = [
  { day: "Mon", approved: 24, flagged: 5, blocked: 2 },
  { day: "Tue", approved: 28, flagged: 7, blocked: 3 },
  { day: "Wed", approved: 32, flagged: 4, blocked: 1 },
  { day: "Thu", approved: 27, flagged: 6, blocked: 2 },
  { day: "Fri", approved: 35, flagged: 8, blocked: 3 },
  { day: "Sat", approved: 18, flagged: 3, blocked: 1 },
];

const awareChartConfig: ChartConfig = {
  Access: {
    label: "Access (First-Line)",
    color: "#169781",
  },
  Watch: {
    label: "Watch (Caution)",
    color: "#F59E0B",
  },
  Reserve: {
    label: "Reserve (Last Resort)",
    color: "#EF4444",
  },
};

const weeklyChartConfig: ChartConfig = {
  approved: {
    label: "Approved & Safe",
    color: "#169781",
  },
  flagged: {
    label: "Needs Review",
    color: "#F59E0B",
  },
  blocked: {
    label: "High Risk (Blocked)",
    color: "#EF4444",
  },
};

export function StatsCharts({ awareDistribution }: StatsChartsProps) {
  const awareData = awareDistribution
    ? [
        {
          name: "Access",
          label: "Access (First-Line)",
          value: Math.round(awareDistribution.access_pct),
          fill: "#169781",
        },
        {
          name: "Watch",
          label: "Watch (Caution)",
          value: Math.round(awareDistribution.watch_pct),
          fill: "#F59E0B",
        },
        {
          name: "Reserve",
          label: "Reserve (Last Resort)",
          value: Math.round(awareDistribution.reserve_pct),
          fill: "#EF4444",
        },
      ]
    : DEFAULT_AWARE_DATA;

  const accessPct = awareDistribution ? Math.round(awareDistribution.access_pct) : 58;
  const isTargetMet = awareDistribution ? awareDistribution.who_target_met : accessPct >= 60;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: WHO AWaRe Prescribing Distribution */}
      <Card className="bg-white border-slate-200/90 shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E2FAD9] flex items-center justify-center text-[#169781] shrink-0">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#0D607B]">
                  Antibiotic Group Breakdown (WHO AWaRe)
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                  Global guideline target: At least 60% should be safe first-line (Access) antibiotics
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[11px] font-semibold shrink-0 ${
                isTargetMet
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {isTargetMet ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{accessPct}% Target Met</span>
                </span>
              ) : (
                <span>{accessPct}% Access (Goal: ≥60%)</span>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-3">
          <div className="w-full h-64">
            <ChartContainer
              config={awareChartConfig}
              className="w-full h-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={awareData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {awareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey="name"
                      className="pt-1 flex-wrap gap-4 text-xs justify-center"
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Weekly Prescription Safety Outcomes */}
      <Card className="bg-white border-slate-200/90 shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B] shrink-0">
                <BarChart3 className="w-4 h-4 text-[#169781]" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#0D607B]">
                  Weekly Prescription Safety Outcomes
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                  Number of prescriptions approved, flagged for review, or blocked this week
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-slate-50 text-slate-600 border-slate-200"
            >
              Past 6 Days
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-3">
          <div className="w-full h-64">
            <ChartContainer
              config={weeklyChartConfig}
              className="w-full h-full"
            >
              <BarChart
                data={WEEKLY_AUDIT_DATA}
                margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={6}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <ChartLegend
                  content={<ChartLegendContent className="pt-1 flex-wrap gap-4 text-xs justify-center" />}
                />
                <Bar dataKey="approved" fill="#169781" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="blocked" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
