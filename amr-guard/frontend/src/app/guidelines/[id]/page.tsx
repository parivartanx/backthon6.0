"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getGuidelineItemById } from "@/lib/guidelineData";
import { generateGuidelineReportPdf } from "@/lib/guidelinePdfGenerator";
import {
  ArrowLeft,
  Building2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  FilePlus2,
  ShieldCheck,
  Stethoscope,
  Info,
  AlertCircle,
  Clock,
  Activity,
  Layers,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GuidelineDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const item = getGuidelineItemById(id);

  const [pdfGenerating, setPdfGenerating] = useState<"print" | "download" | null>(null);

  const handleGeneratePdf = async (action: "print" | "download") => {
    if (!item) return;
    try {
      setPdfGenerating(action);
      await generateGuidelineReportPdf(item, { action });
    } catch (err) {
      console.error("Failed to generate guideline PDF report:", err);
    } finally {
      setPdfGenerating(null);
    }
  };

  if (!item) {
    return (
      <AppShell
        title="Guideline Not Found"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clinical Guidelines", href: "/guidelines" },
          { label: "Not Found" },
        ]}
      >
        <div className="space-y-6 max-w-7xl w-full mx-auto pb-16 min-w-0">
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              Guideline Entry Not Found
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              The requested clinical guideline or antibiotic monograph could not be located in the active formulary index.
            </p>
            <div className="pt-2">
              <Link
                href="/guidelines"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D607B] text-white text-xs font-semibold hover:bg-[#09475c] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Guideline Library</span>
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Common Top Action Bar Component
  const renderActionBar = (titleForPrint: string, primaryAction?: React.ReactNode) => (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <Link
        href="/guidelines"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0D607B] transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span>Back to Guideline Library</span>
      </Link>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleGeneratePdf("download")}
          disabled={pdfGenerating !== null}
          className="h-8 text-xs font-medium gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50"
          title={`Download ${titleForPrint} PDF Report`}
        >
          {pdfGenerating === "download" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D607B]" />
          ) : (
            <Download className="w-3.5 h-3.5 text-[#0D607B]" />
          )}
          <span>Download PDF</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleGeneratePdf("print")}
          disabled={pdfGenerating !== null}
          className="h-8 text-xs font-medium gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50"
          title={`Print ${titleForPrint} PDF Report`}
        >
          {pdfGenerating === "print" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D607B]" />
          ) : (
            <Printer className="w-3.5 h-3.5 text-[#0D607B]" />
          )}
          <span>Print PDF</span>
        </Button>

        {primaryAction}
      </div>
    </div>
  );

  // =========================================================================
  // VIEW 1: WHO AWaRe ANTIBIOTIC MONOGRAPH
  // =========================================================================
  if (item.type === "aware") {
    const drug = item.data;
    const isAccess = drug.category === "Access";
    const isWatch = drug.category === "Watch";
    const isReserve = drug.category === "Reserve";

    return (
      <AppShell
        title={`${drug.genericName} — Antibiotic Monograph`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clinical Guidelines", href: "/guidelines" },
          { label: drug.genericName },
        ]}
      >
        <div className="space-y-6 max-w-7xl w-full mx-auto pb-16 min-w-0">
          {/* Top Action Bar with PDF Print & Download */}
          {renderActionBar(
            drug.genericName,
            <Link
              href={`/prescriptions/new?drug=${encodeURIComponent(drug.genericName)}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-[#0D607B] text-white hover:bg-[#09475c] transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>New Prescription</span>
            </Link>
          )}

          {/* Hero Header Card */}
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {drug.genericName}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-3 py-1 ${
                      isAccess
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : isWatch
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : isReserve
                        ? "bg-purple-50 text-purple-800 border-purple-300"
                        : "bg-red-50 text-red-800 border-red-300"
                    }`}
                  >
                    WHO AWaRe: {drug.category.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  {drug.therapeuticClass}
                  {drug.atcCode && (
                    <span className="text-slate-400 ml-2 font-mono text-xs">
                      (ATC: {drug.atcCode})
                    </span>
                  )}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-left shrink-0 md:text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-medium">
                  Stewardship Tier
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {isAccess
                    ? "Preferred First-Line"
                    : isWatch
                    ? "Restricted / Target Use"
                    : isReserve
                    ? "Last-Resort Hospital Only"
                    : "Discouraged / Banned"}
                </span>
              </div>
            </div>

            {/* Quick Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                  Route of Administration
                </span>
                <span className="font-medium text-slate-700 mt-0.5 block">
                  {drug.routeOfAdministration || "Oral / Systemic"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                  Pregnancy Safety
                </span>
                <span className="font-medium text-slate-700 mt-0.5 block">
                  {drug.pregnancySafety || "Consult Obstetric Guidelines"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                  Common Brands (India)
                </span>
                <span className="font-medium text-slate-700 mt-0.5 block">
                  {drug.brandNames?.join(", ") || "Generic Formulations"}
                </span>
              </div>
            </div>
          </Card>

          {/* Main Clinical Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Dosing, Indications & Pharmacology */}
            <div className="lg:col-span-2 space-y-6">
              {/* Clinical Indications */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h2>Approved Clinical Indications (Outpatient Care)</h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {drug.indications}
                </p>
              </Card>

              {/* Dosing Guidance */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Clock className="w-4 h-4 text-[#0D607B]" />
                  <h2>Standard Dosing Protocols</h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-700 block text-xs">
                      Adult Standard Regimen:
                    </span>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {drug.standardDoseAdult || "Refer to condition-specific protocol"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-700 block text-xs">
                      Pediatric Regimen:
                    </span>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {drug.standardDosePediatric || "Weight-based dosing per pediatrician evaluation"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                    <span className="font-bold text-blue-900 block text-xs">
                      Renal Dosing Adjustment (eGFR / CrCl):
                    </span>
                    <p className="text-blue-800 text-xs leading-relaxed">
                      {drug.renalDosingAdjustment || "Monitor serum creatinine in prolonged therapy"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Mechanism of Action */}
              {drug.mechanismOfAction && (
                <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Layers className="w-4 h-4 text-[#169781]" />
                    <h2>Mechanism of Action &amp; Pharmacology</h2>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {drug.mechanismOfAction}
                  </p>
                </Card>
              )}
            </div>

            {/* Right 1 Col: Stewardship & Safety Cautions */}
            <div className="space-y-6">
              {/* WHO Stewardship Target */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-[#0D607B] font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#169781]" />
                  <h3>WHO Stewardship Target</h3>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] text-xs text-slate-700 leading-relaxed font-medium">
                  {drug.whoTarget}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  WHO recommends that Access tier antibiotics comprise at least <strong>60%</strong> of overall hospital antibiotic consumption to preserve Watch and Reserve agents.
                </p>
              </Card>

              {/* Caution & Adverse Warnings */}
              <Card className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3>Safety Cautions &amp; Risks</h3>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-amber-200/60">
                  {drug.cautions}
                </p>
                {drug.monitoringParameters && (
                  <div className="text-[11px] text-amber-800 pt-1">
                    <strong>Monitoring: </strong> {drug.monitoringParameters}
                  </div>
                )}
              </Card>

              {/* Related ICMR Guidelines */}
              {drug.relatedSyndromes && drug.relatedSyndromes.length > 0 && (
                <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <h3>Relevant ICMR Protocols</h3>
                  </div>
                  <div className="space-y-2">
                    {drug.relatedSyndromes.map((syndrome) => (
                      <div
                        key={syndrome}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-700">{syndrome}</span>
                        <Link
                          href="/guidelines"
                          className="text-[#0D607B] font-semibold text-[11px] hover:underline"
                        >
                          View &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // =========================================================================
  // VIEW 2: ICMR STANDARD TREATMENT GUIDELINE
  // =========================================================================
  if (item.type === "icmr") {
    const stg = item.data;

    return (
      <AppShell
        title={`${stg.syndrome} — Treatment Guideline`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clinical Guidelines", href: "/guidelines" },
          { label: stg.syndrome },
        ]}
      >
        <div className="space-y-6 max-w-7xl w-full mx-auto pb-16 min-w-0">
          {/* Top Action Bar with PDF Print & Download */}
          {renderActionBar(
            stg.syndrome,
            <Link
              href="/prescriptions/new"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-[#0D607B] text-white hover:bg-[#09475c] transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>New Prescription</span>
            </Link>
          )}

          {/* Hero Header Card */}
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {stg.syndrome}
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold"
                  >
                    ICMR STG Standard
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono font-semibold mt-1">
                  Code: {stg.code} &bull; Setting: {stg.clinicalSetting || "Outpatient OPD"}
                </p>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0 text-left md:text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-medium">
                  Protocol Type
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Empirical Outpatient Standard
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              National empirical guideline approved by the Indian Council of Medical Research (ICMR) to prevent broad-spectrum resistance.
            </p>
          </Card>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Therapy, Diagnostics, Pediatrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* First-Line Recommended Therapy */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h2>First-Line Empirical Protocol</h2>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <span className="text-xs uppercase font-bold text-emerald-800 block">
                    Recommended Drug Regimen:
                  </span>
                  <p className="text-base font-bold text-emerald-950">
                    {stg.firstLineTherapy}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-emerald-900 border-t border-emerald-200/70">
                    <div>
                      <strong>Dosage:</strong> {stg.firstLineDose}
                    </div>
                    <div>
                      <strong>Duration:</strong> {stg.durationDays}
                    </div>
                  </div>
                </div>

                {/* Second Line or Alternative */}
                {stg.secondLineTherapy && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <span className="font-bold text-slate-700 block">
                      Second-Line / Penicillin-Allergy Alternative:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {stg.secondLineTherapy}
                    </p>
                  </div>
                )}
              </Card>

              {/* Diagnostic Criteria & Investigations */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Stethoscope className="w-4 h-4 text-[#0D607B]" />
                  <h2>Diagnostic Criteria &amp; Investigations</h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-700 block">
                      Clinical Presentation &amp; Diagnostic Criteria:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {stg.diagnosticCriteria || "Standard clinical criteria for syndrome diagnosis"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-700 block">
                      Point-of-Care &amp; Laboratory Investigations:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {stg.investigationsRecommended || "Routine clinical evaluation indicated"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pediatric Guidance */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Info className="w-4 h-4 text-[#169781]" />
                  <h2>Pediatric Dosing &amp; Age Guidance</h2>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {stg.pediatricGuidance}
                </p>
              </Card>
            </div>

            {/* Right 1 Col: Pathogens & Red Flags */}
            <div className="space-y-6">
              {/* Pathogens */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Activity className="w-4 h-4 text-[#0D607B]" />
                  <h3>Target Pathogens Covered</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {stg.targetPathogens}
                </p>
              </Card>

              {/* Red Flags & Contraindications */}
              <Card className="p-6 bg-red-50/70 border border-red-200 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3>Red Flags &amp; Inappropriate Escalation</h3>
                </div>
                <p className="text-xs text-red-900 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-red-200/60">
                  {stg.redFlagsAndContraindications}
                </p>
              </Card>

              {/* ICMR Reference Citation */}
              <Card className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Official Citation</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {stg.icmrReference}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // =========================================================================
  // VIEW 3: CDSCO BANNED FIXED-DOSE COMBINATION (FDC)
  // =========================================================================
  const fdc = item.data;

  return (
    <AppShell
      title={`${fdc.combination} — Prohibited Combination`}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clinical Guidelines", href: "/guidelines" },
        { label: fdc.combination },
      ]}
    >
      <div className="space-y-6 max-w-7xl w-full mx-auto pb-16 min-w-0">
        {/* Top Action Bar with PDF Print & Download */}
        {renderActionBar(
          fdc.combination,
          <Link
            href="/prescriptions/new"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-[#0D607B] text-white hover:bg-[#09475c] transition-colors"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Prescribe Alternative</span>
          </Link>
        )}

        {/* Hero Header Card */}
        <Card className="p-6 bg-white border border-red-200 rounded-2xl shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {fdc.combination}
                </h1>
                <Badge variant="destructive" className="text-xs font-bold px-2.5 py-0.5">
                  PROHIBITED COMBINATION
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Gazette: {fdc.gazetteNumber} &bull; {fdc.effectiveDate}
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-left md:text-right shrink-0">
              <span className="text-[11px] text-red-600 block uppercase font-bold">
                AMR Sentinel Action
              </span>
              <span className="text-xs font-bold text-red-900">
                Risk Score = 100 (Blocked)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 text-red-900 text-xs border border-red-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Statutory Legal Notice: </strong>
              {fdc.statutoryWarning}
            </p>
          </div>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reason for Ban */}
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2>Clinical Rationale for Prohibition</h2>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {fdc.clinicalRationale}
            </p>

            {fdc.healthHazards && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block text-[11px]">Identified Public Health Hazards:</span>
                <p className="leading-relaxed text-[11px]">{fdc.healthHazards}</p>
              </div>
            )}
          </Card>

          {/* Sanctioned Alternative (Highlight) */}
          <Card className="p-6 bg-white border border-emerald-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2>Approved Clinical Alternative (1-Click Remediation)</h2>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <span className="font-bold block text-xs">
                Recommended Evidence-Based Therapy:
              </span>
              <p className="text-xs font-medium leading-relaxed">
                {fdc.sanctionedAlternative}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/prescriptions/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Prescribe Sanctioned Alternative</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
