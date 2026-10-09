"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SummaryStatCard } from "@/components/common/SummaryStatCard";
import { PrescriptionDataTable } from "@/components/dashboard/PrescriptionDataTable";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { 
  Plus, 
  FileCheck2, 
  Clock, 
  AlertCircle, 
  Zap, 
  UploadCloud, 
  FileEdit, 
  ShieldCheck,
  ArrowRight
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DoctorDashboard() {
  const { cases, metrics, fetchCases } = usePrescriptionStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return (
    <AppShell title="Doctor Dashboard">
      <div className="space-y-7 max-w-7xl mx-auto">
        {/* Header Greeting & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0D607B]">
                Good morning, Dr. Sharma
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/20 font-semibold text-[11px]">
                OPD Active
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review outpatient prescriptions and prepare verified clinical data for antimicrobial auditing.
            </p>
          </div>

          <Button
            asChild
            className="gap-2 px-5 py-2.5 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all hover:shadow-sm shrink-0"
          >
            <Link href="/prescriptions/new">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Prescription</span>
            </Link>
          </Button>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStatCard
            title="Prescriptions Processed"
            value={metrics.prescriptionsProcessed}
            subtitle="Today across outpatient shifts"
            icon={FileCheck2}
            accentColor="#169781"
          />
          <SummaryStatCard
            title="Awaiting Verification"
            value={metrics.awaitingVerification}
            subtitle="Requires clinician review"
            icon={AlertCircle}
            accentColor="#D97706"
          />
          <SummaryStatCard
            title="Audits Ready"
            value={metrics.auditsReady}
            subtitle="Queued for AMR rules engine"
            icon={ShieldCheck}
            accentColor="#0D607B"
          />
          <SummaryStatCard
            title="Avg Processing Time"
            value={`${metrics.averageProcessingTimeMinutes}m`}
            subtitle="Per prescription intake"
            icon={Clock}
            accentColor="#0284C7"
          />
        </div>

        {/* Quick Start Action Cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <Zap className="w-3.5 h-3.5 text-[#169781]" />
            <span>Quick Intake Workflows</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card A: Upload */}
            <Card className="hover:border-[#169781] hover:shadow-xs transition-all py-0">
              <Link
                href="/prescriptions/new?tab=upload"
                className="group p-5 flex items-start gap-4 h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B] group-hover:bg-[#E2FAD9] group-hover:text-[#0d5c36] transition-colors shrink-0">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#0D607B] transition-colors">
                      Upload Prescription Image
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#169781] transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload an outpatient slip or prescription document to prepare for extraction.
                  </p>
                  <div className="mt-2 text-[11px] font-medium text-[#169781]">
                    Supports JPG, PNG, WebP • Drag & Drop
                  </div>
                </div>
              </Link>
            </Card>

            {/* Card B: Manual */}
            <Card className="hover:border-[#169781] hover:shadow-xs transition-all py-0">
              <Link
                href="/prescriptions/new?tab=manual"
                className="group p-5 flex items-start gap-4 h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B] group-hover:bg-[#E2FAD9] group-hover:text-[#0d5c36] transition-colors shrink-0">
                  <FileEdit className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#0D607B] transition-colors">
                      Enter Prescription Manually
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#169781] transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Type or paste prescription text directly with immediate clinical entity parsing.
                  </p>
                  <div className="mt-2 text-[11px] font-medium text-[#0D607B]">
                    Includes 3 OPD Sample Cases for quick evaluation
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        </div>

        {/* Recent Prescription Activity Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#0D607B] uppercase tracking-wide">
                Recent Prescription Activity
              </h2>
              <p className="text-xs text-slate-500">
                Outpatient cases pending verification and ready for AMR clinical audit
              </p>
            </div>
          </div>

          <PrescriptionDataTable data={cases} />
        </div>
      </div>
    </AppShell>
  );
}
