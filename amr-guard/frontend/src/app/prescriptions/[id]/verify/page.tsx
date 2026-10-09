"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { WorkflowStepper } from "@/components/common/WorkflowStepper";
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

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default function VerifyPrescriptionPage({ params }: VerifyPageProps) {
  const resolvedParams = use(params);
  const rawId = decodeURIComponent(resolvedParams.id);

  // [SOLID: DIP] Zustand store hooks
  const {
    cases,
    activeCase,
    getCaseById,
    setActiveCase,
    confirmAuditReady,
    fetchCases,
  } = usePrescriptionStore();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Load case into active state
  useEffect(() => {
    if (cases.length === 0) {
      fetchCases();
    }
  }, [cases.length, fetchCases]);

  useEffect(() => {
    const found = getCaseById(rawId);
    if (found) {
      setActiveCase(found);
    }
  }, [rawId, cases, getCaseById, setActiveCase]);

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
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#169781] text-white text-xs font-semibold hover:bg-[#117866] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2FAD9] text-[#0d5c36] border border-[#169781]/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
                  <span>Ready for Audit</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300/60">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Awaiting Verification</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Case ID: <strong className="text-slate-800">{activeCase.id}</strong> • Cross-reference extracted medication entities with original source
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prescriptions/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Input</span>
            </Link>

            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866] rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Continue to Audit</span>
            </button>
          </div>
        </div>

        {validationWarning && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationWarning}</span>
          </div>
        )}

        {/* Patient Clinical Info Summary Strip */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
            <User className="w-4 h-4 text-[#0D607B]" />
            <h3 className="text-xs font-bold text-[#0D607B] uppercase tracking-wider">
              Patient Context & Vigilance Parameters
            </h3>
          </div>
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
        </div>

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
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Review Highlighted Fields:</strong> Some medications are missing duration or frequency. Click the edit icon to verify before initiating audit.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incomplete Data Confirmation Dialog */}
      {showIncompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Incomplete Fields Detected</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  One or more medications are marked &quot;Needs Verification&quot; (missing duration or dose). Do you want to proceed and lock the case for audit?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowIncompleteDialog(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Review Fields
              </button>
              <button
                type="button"
                onClick={executeConfirmation}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866] rounded-lg shadow-2xs transition-colors"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

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
