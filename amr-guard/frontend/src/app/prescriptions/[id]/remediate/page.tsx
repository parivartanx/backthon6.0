// [SOLID: SRP & Clean Architecture] Stage 6: Dedicated Clinical Remediation & Prescription Review Page
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { RemediationPanel } from "@/components/RemediationPanel";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { prescriptionStore } from "@/lib/prescriptionStore";
import { generatePrescriptionReportPdf } from "@/lib/pdfReportGenerator";
import { fetchRemediationGuidance, RemediationResponse } from "@/network/services/remediationService";
import { RemediationOption } from "@/types/prescription";

import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  AlertTriangle,
  User, 
  RotateCcw,
  Printer,
  Download,
  Loader2,
  History,
  FileText,
  ArrowRight,
  ExternalLink,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RemediationReviewPage() {
  const routeParams = useParams();
  const router = useRouter();
  const rawId = typeof routeParams?.id === "string" ? decodeURIComponent(routeParams.id) : "";

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
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [remediationResponse, setRemediationResponse] = useState<RemediationResponse | null>(null);
  const [isExploringRemediation, setIsExploringRemediation] = useState(false);

  // Load prescription case
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

  const resolvedCase = useMemo(() => {
    if (activeCase && activeCase.id.toLowerCase() === rawId.toLowerCase()) {
      return activeCase;
    }
    return rawId ? (getCaseById(rawId) || prescriptionStore.getById(rawId)) : undefined;
  }, [activeCase, rawId, getCaseById]);

  if (!hasLoaded && !resolvedCase) {
    return (
      <AppShell title="Clinical Remediation & Prescription Review">
        <div className="max-w-md mx-auto my-16">
          <LoadingState
            message="Loading clinical case..."
            subMessage={`Retrieving record ${rawId || ""}`}
          />
        </div>
      </AppShell>
    );
  }

  if (!resolvedCase) {
    return (
      <AppShell title="Clinical Remediation & Prescription Review">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Prescription Case Not Found
          </h2>
          <p className="text-xs text-slate-500">
            Could not locate case ID: <span className="font-mono text-slate-700">{rawId}</span> in clinic repository.
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
  const auditRes = currentCase.auditResult;

  const handleExploreRemediation = async () => {
    try {
      setIsExploringRemediation(true);
      const flaggedDrug = currentCase.auditResult?.flags.find((f) => f.drug)?.drug;
      const res = await fetchRemediationGuidance({
        canonical_syndrome:
          currentCase.patient.canonical_syndrome ||
          currentCase.patient.suspectedDiagnosis ||
          currentCase.patient.symptoms,
        flagged_drug: flaggedDrug,
        patient: currentCase.patient,
      });
      setRemediationResponse(res);
      setSuccessNotice("Retrieved live clinical guidelines and first-line Access recommendations from engine.");
    } catch (err) {
      console.error("Failed to fetch remediation guidance:", err);
      setValidationWarning("Could not retrieve expanded recommendations from stewardship engine.");
    } finally {
      setIsExploringRemediation(false);
    }
  };

  const handleApplyRemediation = async (opt: RemediationOption) => {
    try {
      setValidationWarning(null);
      const updatedMeds = [...currentCase.medicines];
      let actionSummary = "";

      if (opt.recommendation_type === "SWITCH_DRUG" && opt.suggested_drug) {
        let targetIndex = updatedMeds.findIndex((m) =>
          currentCase.auditResult?.flags.some(
            (f) =>
              f.drug &&
              (m.genericName.toLowerCase().includes(f.drug.toLowerCase()) ||
                m.brandName.toLowerCase().includes(f.drug.toLowerCase()))
          )
        );
        if (targetIndex === -1) {
          targetIndex = updatedMeds.findIndex(
            (m) => m.aware_tier === "Watch" || m.aware_tier === "Reserve"
          );
        }
        if (targetIndex === -1) targetIndex = 0;

        if (targetIndex >= 0 && targetIndex < updatedMeds.length) {
          const oldName = updatedMeds[targetIndex].genericName || updatedMeds[targetIndex].brandName;
          updatedMeds[targetIndex] = {
            ...updatedMeds[targetIndex],
            genericName: opt.suggested_drug,
            brandName: opt.suggested_drug,
            aware_tier: "Access",
            verificationStatus: "Verified",
          };
          actionSummary = `Switched ${oldName} to recommended first-line agent: ${opt.suggested_drug}`;
        }
      } else if (
        opt.recommendation_type === "REDUCE_DURATION" &&
        opt.suggested_duration_days
      ) {
        let targetIndex = updatedMeds.findIndex(
          (m) => (m.duration_days || 0) > opt.suggested_duration_days!
        );
        if (targetIndex === -1) targetIndex = 0;

        if (targetIndex >= 0 && targetIndex < updatedMeds.length) {
          updatedMeds[targetIndex] = {
            ...updatedMeds[targetIndex],
            duration: `${opt.suggested_duration_days} days`,
            duration_days: opt.suggested_duration_days,
            verificationStatus: "Verified",
          };
          actionSummary = `Reduced course duration to ${opt.suggested_duration_days} days`;
        }
      } else if (
        opt.recommendation_type === "DISCONTINUE" ||
        opt.recommendation_type === "MANDATE_SYMPTOMATIC"
      ) {
        let targetIndex = updatedMeds.findIndex((m) =>
          currentCase.auditResult?.flags.some(
            (f) =>
              f.drug &&
              (m.genericName.toLowerCase().includes(f.drug.toLowerCase()) ||
                m.brandName.toLowerCase().includes(f.drug.toLowerCase()))
          )
        );
        if (targetIndex === -1) targetIndex = 0;

        if (targetIndex >= 0 && targetIndex < updatedMeds.length) {
          const oldName = updatedMeds[targetIndex].genericName || updatedMeds[targetIndex].brandName;
          updatedMeds[targetIndex] = {
            ...updatedMeds[targetIndex],
            brandName: "Paracetamol 650mg",
            genericName: "Paracetamol",
            dose: "650mg",
            frequency: "TDS PRN",
            duration: "3 days",
            duration_days: 3,
            aware_tier: "Access",
            verificationStatus: "Verified",
          };
          actionSummary = `Discontinued unindicated ${oldName} and prescribed supportive symptomatic therapy`;
        }
      } else {
        actionSummary = `Applied clinical recommendation: ${opt.guidance}`;
      }

      const updatedCase: typeof currentCase = {
        ...currentCase,
        medicines: updatedMeds,
        updatedAt: new Date().toISOString(),
      };

      setActiveCase(updatedCase);
      await saveCase(updatedCase);
      setSuccessNotice(`${actionSummary}. Re-evaluating prescription safety...`);

      // Automatically re-run audit on the updated case
      await auditActiveCase();
      setSuccessNotice(`${actionSummary}. Prescription safely updated and re-verified against guidelines!`);
    } catch (err) {
      console.error("Failed to apply remediation:", err);
      setValidationWarning(err instanceof Error ? err.message : "Failed to apply remediation");
    }
  };

  const handleRetainWithRationale = async (rationale: string, retainedDrug?: string) => {
    try {
      const overrideData = {
        rationale,
        doctorName: "Dr. Ananya Sharma, MD",
        timestamp: new Date().toISOString(),
        retainedDrug,
      };
      const updatedCase: typeof currentCase = {
        ...currentCase,
        clinicalOverride: overrideData,
        auditResult: currentCase.auditResult ? {
          ...currentCase.auditResult,
          status: "OVERRIDDEN" as const,
        } : undefined,
        updatedAt: new Date().toISOString(),
      };
      setActiveCase(updatedCase);
      await saveCase(updatedCase);
      setSuccessNotice(`Clinical override recorded by Dr. Ananya Sharma. Original prescription retained with documented justification.`);
    } catch (err) {
      console.error("Failed to record clinical override:", err);
      setValidationWarning("Could not record clinical override rationale.");
    }
  };

  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generatePrescriptionReportPdf(currentCase, { action: "print" });
    } catch (err) {
      console.error("Failed to print PDF report:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generatePrescriptionReportPdf(currentCase, { action: "download" });
    } catch (err) {
      console.error("Failed to download PDF report:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const displayOptions = remediationResponse?.options || auditRes?.remediation_options || [];

  return (
    <AppShell
      title="Clinical Remediation & Decision Support"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clinical Remediation", href: "/remediation" },
        { label: currentCase.id },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header (No duplicate breadcrumbs) */}
        <PageHeader
          title="Clinical Remediation & Alternative Selection"
          description="Review ICMR-recommended first-line alternatives, clinical rationale, and take physician action (Accept, Modify, or Retain with Rationale)."
          backHref="/remediation"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Case ID: <strong className="text-slate-800 font-mono">{currentCase.id}</strong>
            </span>
            {currentCase.patient.patientName && (
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Patient: {currentCase.patient.patientName}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              currentCase.clinicalOverride
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : auditRes?.status === "APPROVED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : auditRes?.status === "BLOCKED"
                ? "bg-rose-50 text-rose-800 border-rose-300"
                : "bg-amber-50 text-amber-800 border-amber-300"
            }`}>
              {currentCase.clinicalOverride ? (
                <FileText className="w-3.5 h-3.5 text-amber-700" />
              ) : auditRes?.status === "APPROVED" ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : auditRes?.status === "BLOCKED" ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>
                {currentCase.clinicalOverride
                  ? "Retained with Rationale"
                  : auditRes?.status === "APPROVED"
                  ? "Safe & Approved"
                  : auditRes?.status === "BLOCKED"
                  ? "High Risk (Blocked)"
                  : "Review Required"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC] gap-1.5"
            >
              <Link href="/remediation">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Remediation Queue</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC] gap-1.5"
            >
              <Link href={`/prescriptions/${currentCase.id}/verify`}>
                <FileText className="w-3.5 h-3.5" />
                <span>Verification Record</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50 gap-1.5"
            >
              <Link href="/history">
                <History className="w-3.5 h-3.5" />
                <span>Audit History</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Success and Warning Alerts */}
        {successNotice && (
          <Alert className="py-2.5 px-3 bg-emerald-50 border-emerald-300 text-emerald-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <AlertDescription className="text-xs font-medium">{successNotice}</AlertDescription>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70 p-1 rounded-md transition-colors shrink-0"
              aria-label="Dismiss notice"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        )}

        {validationWarning && (
          <Alert variant="destructive" className="py-2.5 px-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <AlertDescription className="text-xs">{validationWarning}</AlertDescription>
            </div>
            <button
              type="button"
              onClick={() => setValidationWarning(null)}
              className="text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 p-1 rounded-md transition-colors shrink-0"
              aria-label="Dismiss warning"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        )}

        {/* Top Summary: Risk Score Gauge + Clinical Context Strip */}
        {auditRes && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5">
              <RiskScoreGauge
                score={auditRes.score}
                band={auditRes.band}
                penalties={auditRes.penalties}
                status={auditRes.status}
                latencyMs={auditRes.latency_ms}
              />
            </div>

            <div className="lg:col-span-7">
              <Card className="bg-white border-slate-200/90 shadow-2xs p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <span className="text-xs font-bold text-[#0D607B] uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      Patient & Clinical Context
                    </span>
                    {currentCase.patient.canonical_syndrome && (
                      <Badge variant="outline" className="text-[10px] bg-[#F1F8FC] border-[#C9E9EB] text-[#0D607B]">
                        {currentCase.patient.canonical_syndrome}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Patient Name</span>
                      <span className="font-bold text-slate-900">{currentCase.patient.patientName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Age / Sex</span>
                      <span className="font-semibold text-slate-800">
                        {currentCase.patient.age ? `${currentCase.patient.age} yrs` : "—"} • {currentCase.patient.sex || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Renal (eGFR)</span>
                      <span className="font-semibold text-slate-800">
                        {currentCase.patient.egfr ? `${currentCase.patient.egfr} mL/min` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Culture Report</span>
                      <span className="font-medium text-slate-700">
                        {currentCase.patient.has_culture_report ? "Available" : "None attached"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Symptoms / Diagnosis</span>
                      <span className="font-medium text-slate-800 truncate block">
                        {currentCase.patient.symptoms || "—"}
                        {currentCase.patient.suspectedDiagnosis ? ` (${currentCase.patient.suspectedDiagnosis})` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Prescribed Medicines: <strong>{currentCase.medicines.length}</strong></span>
                  <span>Safety Flags Triggered: <strong className="text-rose-600">{auditRes.flags.length}</strong></span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* STAGE 6: DEDICATED REMEDIATION PANEL */}
        <Card className="bg-white border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
          <RemediationPanel
            options={displayOptions}
            flags={auditRes?.flags || []}
            medicines={currentCase.medicines}
            clinicalOverride={currentCase.clinicalOverride}
            firstLineRegimen={remediationResponse?.first_line_access_regimen}
            stewardshipGuidance={remediationResponse?.stewardship_guidance}
            isLoadingMore={isExploringRemediation}
            onExploreMore={handleExploreRemediation}
            onApply={handleApplyRemediation}
            onModify={() => {
              router.push(`/prescriptions/${currentCase.id}/verify`);
            }}
            onRetainWithRationale={handleRetainWithRationale}
          />
        </Card>

        {/* STAGE 7: FINAL AUDIT SUMMARY & HISTORY CONSOLE */}
        {auditRes && (
          <Card className="bg-white border border-slate-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#0D607B]">
                    Audit Summary & Clinical Decision History
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Official evaluation outcome, decision rationale, and tamper-proof report export
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border ${
                  currentCase.clinicalOverride
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : auditRes.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : auditRes.status === "BLOCKED"
                    ? "bg-rose-50 text-rose-800 border-rose-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {currentCase.clinicalOverride
                    ? "Retained with Documented Clinical Rationale"
                    : auditRes.status === "APPROVED"
                    ? "Prescription Approved • Guideline Compliant"
                    : auditRes.status === "BLOCKED"
                    ? "Action Required • Prescription Blocked"
                    : "Review Required"}
                </span>
              </div>
            </div>

            {/* Audit Trail Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/70">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Case Reference</span>
                <span className="font-mono font-bold text-slate-800">{currentCase.id}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reviewing Clinician</span>
                <span className="font-medium text-slate-800">
                  {currentCase.clinicalOverride?.doctorName || "Dr. Ananya Sharma, MD"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Evaluation Timestamp</span>
                <span className="font-mono text-slate-700">
                  {currentCase.updatedAt ? new Date(currentCase.updatedAt).toLocaleString() : "Just now"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Final Risk Index</span>
                <span className={`font-bold ${
                  currentCase.clinicalOverride
                    ? "text-amber-800"
                    : auditRes.score <= 30
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}>
                  {currentCase.clinicalOverride ? "Overridden (Recorded)" : `${auditRes.score.toFixed(1)} / 100`}
                </span>
              </div>
            </div>

            {/* If clinical override rationale exists */}
            {currentCase.clinicalOverride && (
              <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 space-y-1">
                <span className="text-[11px] font-bold text-amber-900 block">
                  Documented Physician Override Rationale:
                </span>
                <p className="text-xs text-amber-900 italic font-medium leading-relaxed">
                  &quot;{currentCase.clinicalOverride.rationale}&quot;
                </p>
              </div>
            )}

            {/* Stage 7 Action Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC] gap-1.5"
              >
                <Link href="/history">
                  <History className="w-3.5 h-3.5" />
                  <span>View All Prescriptions in Audit History</span>
                </Link>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintPdf}
                  disabled={isGeneratingPdf}
                  className="h-8 text-xs gap-1.5 text-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="h-8 text-xs gap-1.5 bg-[#169781] hover:bg-[#117866] text-white font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official Audit Report</span>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
