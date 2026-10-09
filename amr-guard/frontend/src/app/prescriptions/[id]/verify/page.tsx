"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WorkflowStepper } from "@/components/common/WorkflowStepper";
import { LoadingState } from "@/components/common/LoadingState";
import { PrescriptionSourceViewer } from "@/components/prescriptions/PrescriptionSourceViewer";
import { MedicineTable } from "@/components/prescriptions/MedicineTable";
import { AuditConfirmationModal } from "@/components/prescriptions/AuditConfirmationModal";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  AlertTriangle
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
    confirmAuditReady,
    fetchCases,
  } = usePrescriptionStore();

  const [hasLoaded, setHasLoaded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Load cases into store if empty
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (cases.length === 0) {
        await fetchCases();
      }
      if (mounted) {
        setHasLoaded(true);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [cases.length, fetchCases]);

  // Sync active case from URL id
  useEffect(() => {
    if (rawId) {
      const found = getCaseById(rawId);
      if (found) {
        setActiveCase(found);
      }
    }
  }, [rawId, cases, getCaseById, setActiveCase]);

  // Loading state while store initialises
  if (!hasLoaded && !activeCase) {
    return (
      <AppShell title="Verify Prescription Details">
        <div className="max-w-md mx-auto my-16">
          <LoadingState
            message="Loading prescription case..."
            subMessage={`Retrieving record ${rawId || ""}`}
          />
        </div>
      </AppShell>
    );
  }

  if (!activeCase) {
    return (
      <AppShell title="Verify Prescription Details">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Case Not Found
          </h2>
          <p className="text-xs text-slate-500">
            Could not locate case ID: <span className="font-mono text-slate-700">{rawId}</span>.
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

  const isAlreadyAudited = activeCase.workflowStatus === "Ready for Audit";
  const hasIncompleteMed = activeCase.medicines.some(
    (m) => m.verificationStatus === "Needs Verification" || !m.duration
  );

  const executeConfirmation = async () => {
    try {
      await confirmAuditReady();
      setShowIncompleteDialog(false);
      setShowConfirmModal(true);
    } catch (err) {
      setValidationWarning(err instanceof Error ? err.message : "Failed to confirm prescription");
    }
  };

  const handleConfirm = () => {
    setValidationWarning(null);
    if (activeCase.medicines.length === 0) {
      setValidationWarning("Please add at least one medication before proceeding.");
      return;
    }

    if (hasIncompleteMed) {
      setShowIncompleteDialog(true);
      return;
    }

    executeConfirmation();
  };

  return (
    <AppShell
      title="Verify Prescription Details"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Cases", href: "/dashboard" },
        { label: `Verify ${activeCase.id}` },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Stepper: Step 2 active */}
        <WorkflowStepper currentStep={2} />

        {/* Screen Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#0D607B] tracking-tight">
                Verify Prescription Details
              </h1>
              {isAlreadyAudited ? (
                <Badge variant="outline" className="gap-1 bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
                  <span>Ready for Audit</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-800 border-amber-300/60">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Awaiting Verification</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Case ID: <strong className="text-slate-800">{activeCase.id}</strong> • Cross-reference extracted medication entities with original source
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">
              <Link href="/prescriptions/new">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Input</span>
              </Link>
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              size="sm"
              className="gap-1.5 text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866] shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Continue to Audit</span>
            </Button>
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
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#0D607B]" />
              <CardTitle className="text-xs font-bold text-[#0D607B] uppercase tracking-wider">
                Patient Context & Vigilance Parameters
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-0 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Age / Sex</span>
                <span className="font-semibold text-slate-800">
                  {activeCase.patient.age || "—"} yrs • {activeCase.patient.sex}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pregnancy</span>
                <span className="font-medium text-slate-700">{activeCase.patient.pregnancyStatus}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Documented Allergies</span>
                <span className={`font-semibold ${
                  activeCase.patient.allergies && !activeCase.patient.allergies.toLowerCase().includes("none") && !activeCase.patient.allergies.toLowerCase().includes("nkda")
                    ? "text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"
                    : "text-slate-700"
                }`}>
                  {activeCase.patient.allergies || "None"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Symptoms / Diagnosis</span>
                <span className="font-medium text-slate-800 truncate block" title={activeCase.patient.symptoms}>
                  {activeCase.patient.symptoms || "—"}
                  {activeCase.patient.suspectedDiagnosis ? ` (${activeCase.patient.suspectedDiagnosis})` : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Split Screen Layout (Side-by-side on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Collapsible Prescription Source Viewer */}
          <div className="lg:col-span-4 sticky top-20">
            <PrescriptionSourceViewer
              sourceType={activeCase.sourceType}
              sourceText={activeCase.sourceText}
              imagePreviewUrl={activeCase.imagePreviewUrl}
              imageFileName={activeCase.imageFileName}
            />
          </div>

          {/* Right: Extracted Medicine Table with Inline Editing */}
          <div className="lg:col-span-8 space-y-4">
            <MedicineTable
              medicines={activeCase.medicines}
              onChange={(updatedList) => {
                const current = activeCase;
                const updatedCase = {
                  ...current,
                  medicines: updatedList,
                  updatedAt: new Date().toISOString(),
                };
                setActiveCase(updatedCase);
                usePrescriptionStore.getState().saveCase(updatedCase);
              }}
            />

            {/* Incomplete warning banner */}
            {hasIncompleteMed && (
              <Alert className="border-amber-300 bg-amber-50/60 text-amber-900 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <AlertDescription className="text-xs ml-2 leading-relaxed">
                  <strong className="font-semibold">Review Highlighted Fields:</strong> Some medications are missing duration or frequency. Click the edit icon to verify before initiating audit.
                </AlertDescription>
              </Alert>
            )}
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
                  One or more medications are marked &quot;Needs Verification&quot; (missing duration or dose). Do you want to proceed and lock the case for audit?
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
              onClick={executeConfirmation}
              className="text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866]"
            >
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <AuditConfirmationModal
        isOpen={showConfirmModal}
        caseId={activeCase.id}
        medicineCount={activeCase.medicines.length}
        onClose={() => setShowConfirmModal(false)}
      />
    </AppShell>
  );
}
