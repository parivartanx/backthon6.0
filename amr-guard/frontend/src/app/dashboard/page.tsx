// [SOLID: SRP] Clinical Antimicrobial Dashboard
// Simple, mature, non-technical interface for doctors, clinicians, and hospital staff
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SummaryStatCard } from "@/components/common/SummaryStatCard";
import { PrescriptionDataTable } from "@/components/dashboard/PrescriptionDataTable";
import { StatsCharts } from "@/components/StatsCharts";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import {
  DashboardMetricsSkeleton,
  DashboardChartsSkeleton,
  DashboardTableSkeleton,
} from "@/components/common/ShimmerSkeleton";
import {
  Plus,
  FileCheck2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  History,
  Activity,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DoctorDashboard() {
  const { cases, metrics, isLoading, error, fetchCases } = usePrescriptionStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return (
    <AppShell
      title="Clinical Dashboard"
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-6 max-w-7xl w-full mx-auto pb-16 min-w-0">
        {/* Top Header Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#169781] shrink-0">
              <Activity className="w-5 h-5 text-[#169781]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Clinical Antimicrobial Dashboard
                </h1>
                <Badge
                  variant="outline"
                  className="bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/20 text-xs font-semibold"
                >
                  Active Monitoring
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Overview of outpatient antibiotic prescriptions, guideline safety checks, and stewardship adherence.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <Button
              asChild
              className="gap-2 px-4 py-2 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-[1.01]"
            >
              <Link href="/prescriptions/new">
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Prescription</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="gap-2 px-3.5 py-2 rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium"
            >
              <Link href="/history">
                <History className="w-4 h-4 text-slate-500" />
                <span>Audit History</span>
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fetchCases()}
              disabled={isLoading}
              className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Refresh dashboard data"
              aria-label="Refresh data"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#169781]" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Clinical Error Banner */}
        {error && (
          <Alert className="bg-amber-50/80 border-amber-200 text-amber-900 py-3 rounded-2xl shadow-2xs">
            <div className="flex items-start justify-between w-full">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-950">{error.title}</p>
                  <AlertDescription className="text-xs text-amber-800">
                    {error.userMessage}
                  </AlertDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCases()}
                className="text-xs h-7 gap-1 border-amber-300 text-amber-900 hover:bg-amber-100"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </Button>
            </div>
          </Alert>
        )}

        {/* 4 Summary Metric Cards */}
        {isLoading ? (
          <DashboardMetricsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryStatCard
              title="Total Prescriptions"
              value={metrics.prescriptionsProcessed}
              subtitle="All cases checked"
              icon={FileCheck2}
              badge="Total Checked"
              accentColor="#169781"
            />
            <SummaryStatCard
              title="Approved & Safe"
              value={metrics.auditsReady}
              subtitle="Guideline compliant"
              icon={ShieldCheck}
              badge="Safe Practice"
              accentColor="#0D607B"
            />
            <SummaryStatCard
              title="Needs Doctor Review"
              value={metrics.awaitingVerification}
              subtitle="Dosage or duration flagged"
              icon={AlertCircle}
              badge="Requires Review"
              accentColor="#D97706"
            />
            <SummaryStatCard
              title="High Risk (Blocked)"
              value={metrics.criticalBlockedCases || 0}
              subtitle="Unsafe antibiotics intercepted"
              icon={ShieldAlert}
              badge="Zero-Tolerance"
              accentColor="#EF4444"
            />
          </div>
        )}

        {/* Charts & Graphs Section (Built using Shadcn UI Chart components) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#0D607B] uppercase tracking-wide">
                Antibiotic Safety &amp; Usage Trends
              </h2>
              <p className="text-xs text-slate-500">
                WHO AWaRe group distribution and weekly safety outcomes
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[11px] bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 font-medium"
            >
              ICMR &amp; WHO Guidelines
            </Badge>
          </div>

          {isLoading ? (
            <DashboardChartsSkeleton />
          ) : (
            <StatsCharts awareDistribution={metrics.awareDistribution} />
          )}
        </div>

        {/* Recent Prescriptions Table with Pagination (5, 10, 15, 20 rows per page) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#0D607B] uppercase tracking-wide">
                Recent Prescriptions
              </h2>
              <p className="text-xs text-slate-500">
                Click &quot;View Details&quot; on any prescription to see its full safety audit and recommendations
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-[#0D607B] hover:text-[#169781] hover:bg-[#F1F8FC] gap-1"
            >
              <Link href="/history">
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton />
          ) : (
            <PrescriptionDataTable data={cases} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
