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
  ChevronRight
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
  const { cases, fetchCases, saveCase, isLoading } = usePrescriptionStore();

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

  // Direct 1-Click Action: Accept Recommended Alternative
  const handleAcceptAlternative = async (c: PrescriptionCase) => {
    try {
      setErrorMessage(null);
      const updatedMeds = [...c.medicines];

      // Find first-line alternative
      const firstOpt = c.auditResult?.remediation_options?.[0];
      const suggestedDrug = firstOpt?.suggested_drug || "Amoxicillin";
      const suggestedDays = firstOpt?.suggested_duration_days || 5;

      // Replace flagged or first antibiotic
      if (updatedMeds.length > 0) {
        const originalName = updatedMeds[0].genericName || updatedMeds[0].brandName;
        updatedMeds[0] = {
          ...updatedMeds[0],
          brandName: suggestedDrug,
          genericName: suggestedDrug,
          dose: "250 mg",
          duration: `${suggestedDays} days`,
          duration_days: suggestedDays,
          aware_tier: "Access",
          verificationStatus: "Verified",
        };

        const updatedCase: PrescriptionCase = {
          ...c,
          medicines: updatedMeds,
          workflowStatus: "Audited",
          auditResult: {
            score: 10.0,
            band: "GREEN",
            status: "APPROVED",
            flags: [],
            remediation_options: [],
            penalties: { p_class: 0, p_duration: 0, p_indication: 0 },
            latency_ms: 18,
            timestamp: new Date().toISOString(),
          },
          clinicalOverride: undefined,
          updatedAt: new Date().toISOString(),
        };

        await saveCase(updatedCase);
        setSuccessMessage(`Prescription ${c.id} remediated: Switched ${originalName} to recommended first-line ${suggestedDrug} (${suggestedDays} days). Status is now Safe & Approved.`);
        setTimeout(() => setSuccessMessage(null), 6000);
      }
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
      const targetDrug = 
        retainModalCase.auditResult?.flags?.find(f => f.drug)?.drug ||
        retainModalCase.medicines[0]?.genericName || 
        "Prescribed antimicrobial";

      const updatedCase: PrescriptionCase = {
        ...retainModalCase,
        clinicalOverride: {
          rationale: doctorRationale.trim(),
          retainedDrug: targetDrug,
          doctorName: doctorName.trim(),
          timestamp: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      await saveCase(updatedCase);
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
          <Alert className="py-3 bg-emerald-50 border-emerald-300 text-emerald-900 rounded-2xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <AlertDescription className="text-xs ml-2 font-medium">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="py-3 rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-xs ml-2">{errorMessage}</AlertDescription>
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

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by Patient, Case ID, diagnosis, or medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50/60 border-slate-200 focus-visible:bg-white"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <div className="flex items-center gap-1 text-slate-400 text-xs mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter:</span>
            </div>

            {[
              { label: `All Actionable (${stats.actionable})`, value: "ACTIONABLE" },
              { label: `Critical Blocked (${stats.blocked})`, value: "BLOCKED" },
              { label: `Needs Review (${stats.flagged})`, value: "FLAGGED" },
              { label: `Resolved (${stats.resolved})`, value: "RESOLVED" },
              { label: `All (${stats.total})`, value: "ALL" },
            ].map((tab) => (
              <Button
                key={tab.value}
                type="button"
                variant={filterTab === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterTab(tab.value as typeof filterTab)}
                className={`h-8 text-xs px-2.5 rounded-lg shrink-0 ${
                  filterTab === tab.value
                    ? "bg-[#0D607B] hover:bg-[#09475c] text-white font-medium"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Case Remediation Cards Queue */}
        <div className="space-y-4">
          {filteredCases.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Prescriptions Require Remediation in this View</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All prescriptions in this filter have either complied with ICMR guidelines or already received physician resolution.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilterTab("ALL")}
                className="text-xs text-[#0D607B] border-[#C9E9EB]"
              >
                View All Clinic Records
              </Button>
            </div>
          ) : (
            filteredCases.map((c) => {
              const audit = c.auditResult;
              const status = audit?.status || "APPROVED";
              const isBlocked = status === "BLOCKED";
              const isFlagged = status === "FLAGGED";
              const isRetained = Boolean(c.clinicalOverride);
              const flags = audit?.flags || [];
              const mainFlag = flags[0];
              const remediationOpt = audit?.remediation_options?.[0];
              const primaryMed = c.medicines[0];
              const suggestedAlternative = remediationOpt?.suggested_drug || "Amoxicillin 250mg";
              const suggestedDays = remediationOpt?.suggested_duration_days || 5;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#169781]/40 transition-all p-5 shadow-2xs space-y-4"
                >
                  {/* Top Header: Case ID, Patient, Status Badge */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isRetained
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : isBlocked
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : isFlagged
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      }`}>
                        {isRetained ? (
                          <FileText className="w-4 h-4" />
                        ) : isBlocked ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : isFlagged ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#0D607B]">
                            {c.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {c.patient.patientName || "Outpatient"}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {c.patient.age ? `${c.patient.age}y` : "Age N/A"} {c.patient.sex}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <strong>Diagnosis:</strong> {c.patient.suspectedDiagnosis || c.patient.symptoms || "General OPD"}
                          {c.patient.canonical_syndrome ? ` (${c.patient.canonical_syndrome})` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRetained ? (
                        <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-0.5 font-semibold bg-amber-50 text-amber-800 border-amber-300 rounded-full">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Retained with Rationale</span>
                        </Badge>
                      ) : isBlocked ? (
                        <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-0.5 font-semibold bg-rose-50 text-rose-700 border-rose-300 rounded-full">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>High Risk (Blocked)</span>
                        </Badge>
                      ) : isFlagged ? (
                        <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-0.5 font-semibold bg-amber-50 text-amber-800 border-amber-300 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Needs Review</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-0.5 font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
                          <span>Safe &amp; Approved</span>
                        </Badge>
                      )}

                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-[#0D607B] hover:text-[#169781] hover:bg-[#F1F8FC]"
                      >
                        <Link href={`/prescriptions/${encodeURIComponent(c.id)}/remediate`}>
                          <span>Full Detail</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Overridden / Retained Note */}
                  {c.clinicalOverride && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Doctor Justification Recorded:</span>
                      </div>
                      <p className="italic pl-5">&quot;{c.clinicalOverride.rationale}&quot;</p>
                      <div className="text-[10px] text-amber-700 pl-5">
                        Recorded by {c.clinicalOverride.doctorName} • {new Date(c.clinicalOverride.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}

                  {/* Why Flagged Banner */}
                  {mainFlag && !isRetained && (
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Safety Alert: {mainFlag.rule_name}</span>
                      </div>
                      <p className="text-[11px] text-rose-900/90 pl-5 leading-relaxed">
                        {mainFlag.rationale || mainFlag.rule_name || "Prescription deviates from recommended first-line ICMR STG antimicrobial choice."}
                      </p>
                    </div>
                  )}

                  {/* Side-by-Side Comparison Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Current Regimen */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Current Prescribed Molecule
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-white text-slate-700 border-slate-300">
                          {primaryMed?.aware_tier || "Watch"} Tier
                        </Badge>
                      </div>
                      <div className="font-bold text-slate-900">
                        {primaryMed ? `${primaryMed.brandName} (${primaryMed.genericName}) ${primaryMed.dose || ""}` : "Prescribed Medication"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Course: <span className="font-medium text-slate-700">{primaryMed?.duration || "10 days"}</span> • {primaryMed?.frequency || "BD"}
                      </div>
                    </div>

                    {/* Proposed Guideline Choice */}
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-800">
                          Recommended First-Line Option
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
                          Access Choice
                        </Badge>
                      </div>
                      <div className="font-bold text-emerald-950">
                        {suggestedAlternative}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Recommended Duration: <span className="font-semibold text-emerald-900">{suggestedDays} days</span> (ICMR STG Protocol)
                      </div>
                    </div>
                  </div>

                  {/* Direct Doctor Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-slate-500">
                      Doctor Clinical Actions:
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Action 1: Retain with Rationale */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRetain(c)}
                        className="h-8 text-xs gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Keep Current (Add Reason)</span>
                      </Button>

                      {/* Action 2: Deep Review Page */}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-slate-700 hover:text-[#0D607B] hover:border-[#0D607B]/40"
                      >
                        <Link href={`/prescriptions/${encodeURIComponent(c.id)}/remediate`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Detailed Review</span>
                        </Link>
                      </Button>

                      {/* Action 3: Accept 1-Click Alternative */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAcceptAlternative(c)}
                        className="h-8 text-xs gap-1.5 bg-[#169781] hover:bg-[#117866] text-white font-semibold shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Switch to Recommended Medicine</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRetainModalCase(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRetain}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Confirm &amp; Retain with Rationale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
