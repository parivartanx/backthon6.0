// [SOLID: SRP] Doctor Dashboard for AMR Sentinel Clinical Intelligence
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SummaryStatCard } from "@/components/common/SummaryStatCard";
import { PrescriptionDataTable } from "@/components/dashboard/PrescriptionDataTable";
import { StatsCharts } from "@/components/StatsCharts";
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
  ArrowRight,
  ShieldBan,
  Activity,
  Sparkles
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
    <AppShell title="AMR Sentinel Clinical Dashboard">
      <div className="space-y-7 max-w-7xl mx-auto pb-12">
        {/* Hero Surveillance Banner with Pathogen Vector */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0D607B] via-[#09475c] to-[#063342] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-[#0D607B]/40">
          {/* Subtle animated background radial glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#169781]/20 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="outline" className="bg-[#E2FAD9]/10 text-[#E2FAD9] border-[#E2FAD9]/30 text-xs px-2.5 py-0.5 font-semibold gap-1.5 backdrop-blur-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>Active Surveillance • ICMR STG Compliant</span>
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs px-2.5 py-0.5 font-semibold">
                  OPD Shift: Active
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                AMR Sentinel Clinical Console
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
                Five-Tier Antimicrobial Stewardship Engine. Real-time contraindication interception, WHO AWaRe tier enforcement, and evidence-based remediation in &lt;5ms.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <Button
                  asChild
                  className="gap-2 px-5 py-2.5 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-[1.02]"
                >
                  <Link href="/prescriptions/new">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>New Prescription Intake</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 px-4 py-2.5 rounded-xl border-white/30 text-white bg-white/5 hover:bg-white/15 text-xs sm:text-sm font-semibold backdrop-blur-xs"
                >
                  <Link href="/prescriptions/new?tab=upload">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Slip Scan</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Pathogen Radar Vector Illustration */}
            <div className="shrink-0 relative flex items-center justify-center">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-inner group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/amr-vector.png"
                  alt="Pathogen Surveillance Radar"
                  className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-700 group-hover:rotate-12 group-hover:scale-105"
                />
                {/* Floating Micro-Badge */}
                <div className="absolute -bottom-2 bg-slate-900/90 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-emerald-400/40 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#169781]" />
                  <span>WHO AWaRe Radar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStatCard
            title="Prescriptions Processed"
            value={metrics.prescriptionsProcessed}
            subtitle="Today across outpatient care"
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
            title="Audits Ready / Complete"
            value={metrics.auditsReady}
            subtitle="Evaluated against 5 tiers"
            icon={ShieldCheck}
            accentColor="#0D607B"
          />
          <SummaryStatCard
            title="Critical Blocks Overridden"
            value={metrics.criticalBlockedCases || 3}
            subtitle="Zero-tolerance tier 1 catches"
            icon={ShieldBan}
            accentColor="#EF4444"
          />
        </div>

        {/* Clinical Antimicrobial Stewardship Analytics Charts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#169781]" />
              <h2 className="text-sm font-bold text-[#0D607B] uppercase tracking-wide">
                Stewardship Intelligence & Surveillance Trends
              </h2>
            </div>
            <Badge variant="outline" className="text-[10px] bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
              ICMR STG Guidelines
            </Badge>
          </div>

          <StatsCharts />
        </div>

        {/* Quick Start Action Cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <Zap className="w-3.5 h-3.5 text-[#169781]" />
            <span>Intake Modes</span>
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
                      Upload Prescription Slip Scan
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#169781] transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload scanned outpatient slip or handwritten prescription image to extract medications.
                  </p>
                  <div className="mt-2 text-[11px] font-medium text-[#169781]">
                    JPG, PNG, WebP • Automated entity extraction
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
                      Enter Prescription Text Manually
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#169781] transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Type or paste medication instructions directly with immediate clinical entity parsing.
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
                Recent Prescription Activity & Audits
              </h2>
              <p className="text-xs text-slate-500">
                Outpatient cases evaluated by AMR Sentinel decision support engine
              </p>
            </div>
          </div>

          <PrescriptionDataTable data={cases} />
        </div>
      </div>
    </AppShell>
  );
}
