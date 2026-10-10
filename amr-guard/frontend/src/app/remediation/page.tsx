// [SOLID: SRP & Clean Architecture] Dedicated Functional Clinical Remediation Center
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { 
  PrescriptionCase, 
  RemediationOption, 
  RuleViolation 
} from "@/types/prescription";
import { fetchRemediationGuidance } from "@/network/services/remediationService";
import { RemediationDataTable } from "@/components/remediation/RemediationDataTable";
import { 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Search, 
  Filter, 
  Pill, 
  User, 
  Clock, 
  Sparkles,
  Download,
  AlertCircle,
  Stethoscope,
  ExternalLink,
  ChevronRight,
  Loader2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ClinicalRemediationPage() {
  const router = useRouter();
  const { 
    cases, 
    fetchCases, 
    saveCase, 
    switchCaseDrug,
    retainCaseWithRationale,
    isSwitching,
    isRetaining,
    actionLoadingId,
    isLoading 
  } = usePrescriptionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ACTIONABLE" | "BLOCKED" | "FLAGGED" | "RESOLVED" | "ALL">("ACTIONABLE");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Retain with Rationale Modal State
  const [retainModalCase, setRetainModalCase] = useState<PrescriptionCase | null>(null);
  const [doctorRationale, setDoctorRationale] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Ananya Sharma, MD");
  const [rationaleError, setRationaleError] = useState<string | null>(null);

  useEffect(() => {
    if (cases.length === 0) {
      fetchCases();
    }
  }, [cases.length, fetchCases]);

  // Clinical justification presets
  const clinicalPresets = [
    "Culture sensitivity isolated susceptible pathogen.",
    "Documented allergy/anaphylaxis to first-line penicillin.",
    "Infectious disease specialist consultation approved broad therapy.",
    "Treatment failure on prior first-line Access regimen.",
  ];

  // Derive stats
  const stats = useMemo(() => {
    const blocked = cases.filter((c) => c.auditResult?.status === "BLOCKED" && !c.clinicalOverride).length;
    const flagged = cases.filter((c) => c.auditResult?.status === "FLAGGED" && !c.clinicalOverride).length;
    const resolved = cases.filter((c) => c.auditResult?.status === "APPROVED" || Boolean(c.clinicalOverride)).length;
    const actionable = blocked + flagged;
    return { blocked, flagged, resolved, actionable, total: cases.length };
  }, [cases]);

  // Filter cases dynamically
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const status = c.auditResult?.status || "APPROVED";
      const isRetained = Boolean(c.clinicalOverride);
      const isActionable = (status === "BLOCKED" || status === "FLAGGED") && !isRetained;

      // Tab Filter
      if (filterTab === "ACTIONABLE" && !isActionable) return false;
      if (filterTab === "BLOCKED" && (status !== "BLOCKED" || isRetained)) return false;
      if (filterTab === "FLAGGED" && (status !== "FLAGGED" || isRetained)) return false;
      if (filterTab === "RESOLVED" && !isRetained && status !== "APPROVED") return false;

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesPatient = (c.patient.patientName || "").toLowerCase().includes(q);
        const matchesDiagnosis = (c.patient.suspectedDiagnosis || "").toLowerCase().includes(q);
        const matchesSymptoms = (c.patient.symptoms || "").toLowerCase().includes(q);
        const matchesMeds = c.medicines.some(
          (m) =>
            m.brandName.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q)
        );
        return matchesId || matchesPatient || matchesDiagnosis || matchesSymptoms || matchesMeds;
      }

      return true;
    });
  }, [cases, filterTab, searchQuery]);

  // Confirmed Action: Accept Recommended Alternative
  const handleAcceptAlternative = async (c: PrescriptionCase, confirmedDays?: number) => {
    try {
      setErrorMessage(null);
      const firstOpt = c.auditResult?.remediation_options?.[0];
      const suggestedDrug = firstOpt?.suggested_drug || "Amoxicillin";
      const suggestedDays = confirmedDays || firstOpt?.suggested_duration_days || 5;

      await switchCaseDrug(c.id, suggestedDrug, suggestedDays);
      setSuccessMessage(`Prescription ${c.id} remediated: Switched to recommended first-line ${suggestedDrug} (${suggestedDays} days). Status is now Safe & Approved.`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err) {
      console.error("Failed to apply remediation:", err);
      setErrorMessage("Could not apply alternative: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Open Retain Modal
  const handleOpenRetain = (c: PrescriptionCase) => {
    setRetainModalCase(c);
    setDoctorRationale("");
    setRationaleError(null);
  };

  // Confirm Retain with Rationale
  const handleConfirmRetain = async () => {
    if (!retainModalCase) return;
    if (!doctorRationale.trim()) {
      setRationaleError("Please enter clinical justification before retaining this prescription.");
      return;
    }

    try {
      await retainCaseWithRationale(
        retainModalCase.id,
        doctorRationale.trim(),
        doctorName.trim()
      );
      setSuccessMessage(`Prescription ${retainModalCase.id} retained with documented clinical rationale by ${doctorName}.`);
      setRetainModalCase(null);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err) {
      console.error("Failed to retain prescription:", err);
      setErrorMessage("Could not save doctor rationale.");
    }
  };

  // CSV Export for Stewardship Remediation Audit
  const handleExportCsv = () => {
    const headers = [
      "Prescription ID",
      "Patient Name",
      "Age / Sex",
      "Diagnosis",
      "Status",
      "Flagged Reason",
      "Recommended Alternative",
      "Doctor Action / Rationale"
    ];

    const rows = filteredCases.map((c) => [
      c.id,
      `"${c.patient.patientName || 'Outpatient'}"`,
      `"${c.patient.age || 'N/A'}y / ${c.patient.sex}"`,
      `"${c.patient.suspectedDiagnosis || c.patient.symptoms || 'General OPD'}"`,
      c.clinicalOverride 
        ? "Retained with Rationale" 
        : c.auditResult?.status === "BLOCKED" 
        ? "High Risk (Blocked)" 
        : c.auditResult?.status === "FLAGGED" 
        ? "Needs Review" 
        : "Safe & Approved",
      `"${c.auditResult?.flags?.[0]?.rule_name || 'None'}"`,
      `"${c.auditResult?.remediation_options?.[0]?.suggested_drug || 'Standard First-Line'}"`,
      `"${c.clinicalOverride ? c.clinicalOverride.rationale : 'Pending Review'}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Remediation_Queue_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell
      title="Clinical Remediation Center"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clinical Remediation" },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0D607B] tracking-tight">
                  Clinical Remediation Center
                </h1>
                <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-semibold">
                  Decision Support Queue
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review guideline contraindications, pediatric safety intercepts, and switch to ICMR first-line alternatives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs h-8 px-3 text-[#0D607B] border-slate-200 hover:bg-[#F1F8FC]"
            >
              <Download className="w-3.5 h-3.5 text-[#169781]" />
              <span>Export Remediation Log</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchCases()}
              className="gap-1.5 text-xs h-8 px-3 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#169781]" : "text-slate-400"}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Success & Error Notices */}
        {successMessage && (
          <Alert className="py-2.5 px-3 bg-emerald-50 border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <AlertDescription className="text-xs font-medium">{successMessage}</AlertDescription>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70 p-1 rounded-md transition-colors shrink-0"
              aria-label="Dismiss notice"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="py-2.5 px-3 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 p-1 rounded-md transition-colors shrink-0"
              aria-label="Dismiss error"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        )}

        {/* 4 Stewardship KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Actionable Cases</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1.5">
              {stats.actionable}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Requiring doctor review
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Critical Blocked</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1.5">
              {stats.blocked}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Zero-tolerance safety halts
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Stewardship Flags</span>
              <AlertCircle className="w-4 h-4 text-[#0D607B]" />
            </div>
            <div className="text-2xl font-black text-[#0D607B] mt-1.5">
              {stats.flagged}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Escalation or duration warnings
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Resolved &amp; Safe</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1.5">
              {stats.resolved}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Guideline compliant or overridden
            </span>
          </Card>
        </div>

        {/* Modern Clinical Remediation Data Table */}
        <RemediationDataTable
          cases={filteredCases}
          onAcceptAlternative={handleAcceptAlternative}
          onOpenRetain={handleOpenRetain}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterTab={filterTab}
          onFilterTabChange={setFilterTab}
          stats={stats}
        />
      </div>

      {/* Retain with Rationale Modal */}
      <Dialog open={Boolean(retainModalCase)} onOpenChange={(open) => !open && setRetainModalCase(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Retain Prescription with Clinical Justification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Document your clinical rationale to retain this antimicrobial in the hospital audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Attending Physician Name
              </label>
              <Input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Full Name"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Quick Clinical Presets (Click to insert)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {clinicalPresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setDoctorRationale(preset)}
                    className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1 text-left transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Documented Clinical Rationale <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={3}
                value={doctorRationale}
                onChange={(e) => {
                  setDoctorRationale(e.target.value);
                  setRationaleError(null);
                }}
                placeholder="E.g., Isolated Klebsiella pneumoniae on urine culture resistant to first-line agents. Patient initiated on targeted therapy per antibiogram."
                className="text-xs"
              />
              {rationaleError && (
                <p className="text-[11px] text-rose-600 mt-1">{rationaleError}</p>
              )}
            </div>
          </div>

          {/* Circular Progress Indicator when saving rationale */}
          {isRetaining && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 animate-pulse">
              <svg className="w-5 h-5 animate-spin text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Documenting clinical justification into hospital stewardship audit trail...</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRetaining}
              onClick={() => setRetainModalCase(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isRetaining}
              onClick={handleConfirmRetain}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold min-w-[170px] gap-1.5"
            >
              {isRetaining ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Rationale...</span>
                </>
              ) : (
                <span>Confirm &amp; Retain with Rationale</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
