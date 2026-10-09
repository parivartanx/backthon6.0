"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WorkflowStepper } from "@/components/common/WorkflowStepper";
import { LoadingState } from "@/components/common/LoadingState";
import { PrescriptionSourceViewer } from "@/components/prescriptions/PrescriptionSourceViewer";
import { MedicineTable } from "@/components/prescriptions/MedicineTable";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { FlagCard } from "@/components/FlagCard";
import { RemediationPanel } from "@/components/RemediationPanel";
import { LatencyBadge } from "@/components/LatencyBadge";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { prescriptionStore } from "@/lib/prescriptionStore";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  AlertTriangle,
  RotateCcw,
  Printer
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function VerifyPrescriptionPage() {
  const routeParams = useParams();
  const rawId = typeof routeParams?.id === "string" ? decodeURIComponent(routeParams.id) : "";

  // [SOLID: DIP] Zustand store hooks
  const {
    cases,
    activeCase,
    getCaseById,
    setActiveCase,
    saveCase,
    auditActiveCase,
    isAuditing,
    fetchCases,
  } = usePrescriptionStore();

  const [hasLoaded, setHasLoaded] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Initialize store and sync active case without race condition
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (cases.length === 0) {
        await fetchCases();
      }
      if (rawId && mounted) {
        const found = getCaseById(rawId) || prescriptionStore.getById(rawId);
        if (found) {
          setActiveCase(found);
        }
      }
      if (mounted) {
        setHasLoaded(true);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [rawId, cases.length, fetchCases, getCaseById, setActiveCase]);

  // Fallback direct case locator to avoid premature 404
  const resolvedCase = useMemo(() => {
    if (activeCase && activeCase.id.toLowerCase() === rawId.toLowerCase()) {
      return activeCase;
    }
    return rawId ? (getCaseById(rawId) || prescriptionStore.getById(rawId)) : undefined;
  }, [activeCase, rawId, getCaseById]);

  // Loading state while store initialises
  if (!hasLoaded && !resolvedCase) {
    return (
      <AppShell title="AMR Sentinel Clinical Verification">
        <div className="max-w-md mx-auto my-16">
          <LoadingState
            message="Loading prescription case..."
            subMessage={`Retrieving record ${rawId || ""}`}
          />
        </div>
      </AppShell>
    );
  }

  if (!resolvedCase) {
    return (
      <AppShell title="AMR Sentinel Clinical Verification">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Prescription Case Not Found
          </h2>
          <p className="text-xs text-slate-500">
            Could not locate case ID: <span className="font-mono text-slate-700">{rawId}</span> in local clinic repository.
          </p>
          <Button asChild size="sm" className="bg-[#169781] hover:bg-[#117866] text-white">
            <Link href="/dashboard" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const currentCase = resolvedCase;
  const isAudited = currentCase.workflowStatus === "Audited" && Boolean(currentCase.auditResult);
  const isAlreadyAudited = currentCase.workflowStatus === "Ready for Audit" || isAudited;
  const hasIncompleteMed = currentCase.medicines.some(
    (m) => m.verificationStatus === "Needs Verification" || !m.duration
  );

  const executeAudit = async () => {
    try {
      setShowIncompleteDialog(false);
      setValidationWarning(null);
      await auditActiveCase();
    } catch (err) {
      setValidationWarning(err instanceof Error ? err.message : "Failed to execute clinical audit");
    }
  };

  const handleStartAudit = () => {
    setValidationWarning(null);
    if (currentCase.medicines.length === 0) {
      setValidationWarning("Please add at least one medication before initiating AMR audit.");
      return;
    }

    if (hasIncompleteMed) {
      setShowIncompleteDialog(true);
      return;
    }

    executeAudit();
  };

  return (
    <AppShell
      title="Verify Prescription Details"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Cases", href: "/dashboard" },
        { label: `Verify ${currentCase.id}` },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Stepper: Step 2 active or Step 3 if Audited */}
        <WorkflowStepper currentStep={isAudited ? 3 : 2} />

        {/* Screen Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#0D607B] tracking-tight">
                {isAudited ? "AMR Sentinel Clinical Audit Console" : "Verify Prescription Details"}
              </h1>
              {isAudited ? (
                <Badge variant="outline" className={`gap-1 font-semibold text-[11px] ${
                  currentCase.auditResult?.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : currentCase.auditResult?.status === "BLOCKED"
                    ? "bg-rose-50 text-rose-800 border-rose-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audit Complete: {currentCase.auditResult?.status}</span>
                </Badge>
              ) : isAlreadyAudited ? (
                <Badge variant="outline" className="gap-1 bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/20 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
                  <span>Ready for Audit</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-800 border-amber-300/60 font-semibold text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Awaiting Verification</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Case ID: <strong className="text-slate-800">{currentCase.id}</strong> • Cross-reference extracted medication entities with original clinical slip
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">
              <Link href="/prescriptions/new">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>New Intake</span>
              </Link>
            </Button>

            {isAudited ? (
              <Button
                type="button"
                onClick={executeAudit}
                disabled={isAuditing}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC]"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
                <span>Re-Audit Rules</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStartAudit}
                disabled={isAuditing}
                size="sm"
                className="gap-1.5 text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866] shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>{isAuditing ? "Auditing 5-Tiers..." : "Run AMR Sentinel Audit"}</span>
              </Button>
            )}
          </div>
        </div>

        {validationWarning && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-xs ml-2">{validationWarning}</AlertDescription>
          </Alert>
        )}

        {/* Patient Clinical Info Summary Strip */}
        <Card className="bg-white border-slate-200/90 shadow-2xs py-4">
          <CardHeader className="border-b border-slate-100 pb-2.5 pt-0 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#0D607B]" />
                <CardTitle className="text-xs font-bold text-[#0D607B] uppercase tracking-wider">
                  Patient Context & Clinical Vigilance Parameters
                </CardTitle>
              </div>
              {currentCase.patient.canonical_syndrome && (
                <Badge variant="outline" className="text-[10px] bg-[#F1F8FC] border-[#C9E9EB] text-[#0D607B]">
                  Syndrome: {currentCase.patient.canonical_syndrome}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-0 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Age / Sex</span>
                <span className="font-semibold text-slate-800">
                  {currentCase.patient.age || "—"} yrs • {currentCase.patient.sex}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pregnancy</span>
                <span className="font-medium text-slate-700">{currentCase.patient.pregnancyStatus}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Renal (eGFR)</span>
                <span className="font-semibold text-slate-800">
                  {currentCase.patient.egfr ? `${currentCase.patient.egfr} mL/min` : "Normal / Not recorded"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Culture Report</span>
                <span className="font-medium text-slate-700">
                  {currentCase.patient.has_culture_report ? "Available" : "Empiric Care"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Symptoms / Diagnosis</span>
                <span className="font-medium text-slate-800 truncate block" title={currentCase.patient.symptoms}>
                  {currentCase.patient.symptoms || "—"}
                  {currentCase.patient.suspectedDiagnosis ? ` (${currentCase.patient.suspectedDiagnosis})` : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- AUDIT RESULTS CONSOLE (Rendered when Audited) --- */}
        {isAudited && currentCase.auditResult && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/vector2.jpeg" alt="AMR Sentinel" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0D607B]">
                    AMR Sentinel Decision Support Results
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Five-Tier Verification Engine evaluation against ICMR STG and WHO AWaRe framework
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LatencyBadge latencyMs={currentCase.auditResult.latency_ms} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-7 text-xs gap-1 text-slate-600"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </Button>
              </div>
            </div>

            {/* Top Row: Risk Score Gauge + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6">
                <RiskScoreGauge
                  score={currentCase.auditResult.score}
                  band={currentCase.auditResult.band}
                  penalties={currentCase.auditResult.penalties}
                  status={currentCase.auditResult.status}
                  latencyMs={currentCase.auditResult.latency_ms}
                />
              </div>

              <div className="lg:col-span-6">
                <RemediationPanel
                  options={currentCase.auditResult.remediation_options}
                  onApply={(opt) => {
                    setValidationWarning(`Remediation noted: ${opt.guidance}. You can update medication table below to adjust regimen.`);
                  }}
                />
              </div>
            </div>

            {/* Middle Row: Rule Violations / Flags List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#0D607B] uppercase tracking-wider">
                    Five-Tier Guideline Compliance Flags
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Detailed clinical mechanisms and references for detected prescribing anomalies
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                  {currentCase.auditResult.flags.length} {currentCase.auditResult.flags.length === 1 ? "Rule Triggered" : "Rules Triggered"}
                </Badge>
              </div>

              {currentCase.auditResult.flags.length === 0 ? (
                <div className="p-5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-800 font-medium">
                    Zero rule violations. All prescribed medications, dosages, and durations align with first-line ICMR guidelines.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentCase.auditResult.flags.map((flag, idx) => (
                    <FlagCard
                      key={`${flag.rule_id}-${idx}`}
                      violation={flag}
                      onApplyRemediation={(rem) => {
                        setValidationWarning(`Adopted recommendation: ${rem}`);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Split Screen Layout: Original Source vs Extracted Medicine Table */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0D607B] uppercase tracking-wider">
              Prescription Source & Medication Regimen Review
            </h3>
            <span className="text-[11px] text-slate-400">
              Inline editing updates clinical evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Collapsible Prescription Source Viewer */}
            <div className="lg:col-span-4 sticky top-20">
              <PrescriptionSourceViewer
                sourceType={currentCase.sourceType}
                sourceText={currentCase.sourceText}
                imagePreviewUrl={currentCase.imagePreviewUrl}
                imageFileName={currentCase.imageFileName}
              />
            </div>

            {/* Right: Extracted Medicine Table with Inline Editing */}
            <div className="lg:col-span-8 space-y-4">
              <MedicineTable
                medicines={currentCase.medicines}
                onChange={(updatedList) => {
                  const updatedCase = {
                    ...currentCase,
                    medicines: updatedList,
                    updatedAt: new Date().toISOString(),
                  };
                  setActiveCase(updatedCase);
                  saveCase(updatedCase);
                }}
              />

              {/* Incomplete warning banner */}
              {hasIncompleteMed && (
                <Alert className="border-amber-300 bg-amber-50/60 text-amber-900 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <AlertDescription className="text-xs ml-2 leading-relaxed">
                    <strong className="font-semibold">Review Highlighted Fields:</strong> Some medications are missing duration or frequency. Click the edit icon to verify before running audit.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incomplete Data Confirmation Dialog */}
      <Dialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <DialogContent className="sm:max-w-sm p-5 space-y-4">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-slate-800">Incomplete Fields Detected</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  One or more medications are marked &quot;Needs Verification&quot; (missing duration or dose). Do you want to proceed and run the AMR audit?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowIncompleteDialog(false)}
              className="text-xs font-medium text-slate-600"
            >
              Review Fields
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeAudit}
              className="text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866]"
            >
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
