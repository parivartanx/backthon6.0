// [SOLID: SRP & DIP] New Prescription Intake Page with Real API Extraction, Error/Success Dialogs & Circular Progress CTA
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WorkflowStepper } from "@/components/common/WorkflowStepper";
import { PageHeader } from "@/components/common/PageHeader";
import { PrescriptionUpload } from "@/components/prescriptions/PrescriptionUpload";
import { PrescriptionTextInput } from "@/components/prescriptions/PrescriptionTextInput";
import { PatientContextForm } from "@/components/prescriptions/PatientContextForm";
import { LoadingState } from "@/components/common/LoadingState";
import { CTAButton } from "@/components/common/CTAButton";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { parseClinicalError } from "@/lib/errors";
import { CLINICAL_SAMPLE_PRESETS } from "@/lib/clinicalSamples";
import {
  UploadCloud,
  ArrowRight,
  AlertCircle,
  Info,
  FileText,
  X,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

function NewPrescriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // [SOLID: DIP] Single source of truth from Zustand store
  const {
    draftSourceType,
    draftText,
    draftFile,
    draftPreviewUrl,
    draftPatient,
    isExtracting,
    setDraftSourceType,
    setDraftText,
    updateDraftPatient,
    loadDraftPreset,
    extractAndCreateCase,
  } = usePrescriptionStore();

  const { showError, showSuccess } = useFeedbackStore();
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync query params (e.g. /prescriptions/new?tab=manual)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "manual" || tabParam === "upload") {
      setDraftSourceType(tabParam);
    }
  }, [searchParams, setDraftSourceType]);

  const handleExtract = async () => {
    setValidationError(null);

    // Clinical Validation Gates
    if (!draftPatient.caseId.trim()) {
      const msg = "Patient / Case ID is required.";
      setValidationError(msg);
      showError({
        title: "Missing Patient Identifier",
        message: msg,
        hint: "Please assign a Case ID or patient OPD number before continuing.",
      });
      return;
    }
    if (draftPatient.age === "" || Number(draftPatient.age) < 0) {
      const msg = "A valid patient age is required.";
      setValidationError(msg);
      showError({
        title: "Patient Age Required",
        message: msg,
        hint: "Antimicrobial dosage safety checks and pediatric contraindications depend on patient age.",
      });
      return;
    }
    const clinicalIndication =
      draftPatient.symptoms.trim() || draftPatient.suspectedDiagnosis?.trim();
    if (!clinicalIndication) {
      const msg = "Presenting symptoms or suspected diagnosis are required.";
      setValidationError(msg);
      showError({
        title: "Clinical Indication Required",
        message: msg,
        hint: "Provide clinical symptoms or suspected diagnosis to verify antibiotic indication under ICMR STG guidelines.",
      });
      return;
    }
    // If symptoms was empty but diagnosis was provided, backfill symptoms
    if (!draftPatient.symptoms.trim() && draftPatient.suspectedDiagnosis?.trim()) {
      updateDraftPatient({ symptoms: draftPatient.suspectedDiagnosis.trim() });
    }
    try {
      // Execute Real Extraction or Direct Case Creation from Inputs
      const createdCase = await extractAndCreateCase();

      // Trigger Global Success Dialog with Clear Proceed CTA
      if (createdCase.medicines.length > 0) {
        showSuccess({
          title: "Prescription Successfully Extracted",
          message: `Extracted ${createdCase.medicines.length} medication(s) for patient ${createdCase.patient.caseId}. Clinical entities are ready for review.`,
          details: createdCase.medicines.map((m) => `• ${m.brandName} (${m.genericName}) ${m.strength} ${m.frequency} x ${m.duration}`).join("\n"),
          primaryLabel: "Proceed to Review Medicines",
          onPrimary: () => {
            router.push(`/prescriptions/${encodeURIComponent(createdCase.id)}/verify`);
          },
        });
      } else {
        showSuccess({
          title: "Prescription Case Created",
          message: `Clinical details recorded for patient ${createdCase.patient.caseId}. You can now review patient parameters and add prescribed medications.`,
          primaryLabel: "Proceed to Review Medicines",
          onPrimary: () => {
            router.push(`/prescriptions/${encodeURIComponent(createdCase.id)}/verify`);
          },
        });
      }
    } catch (err) {
      const clinicalErr = parseClinicalError(err, "Prescription extraction");
      setValidationError(clinicalErr.userMessage);

      // Trigger Global Doctor-Friendly Error Dialog with Retry option
      showError({
        error: clinicalErr,
        canRetry: clinicalErr.canRetry,
        onRetry: handleExtract,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-28">
      {/* Page Header with Shadcn Breadcrumbs + Back Arrow */}
      <PageHeader
        title="New Prescription"
        description="Enter patient details and clinical indication, then verify medications before running the safety check."
        backHref="/dashboard"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "New Prescription" },
        ]}
      />

      {/* Stepper: Step 1 active */}
      <WorkflowStepper currentStep={1} />

      {/* Validation Error Banner */}
      {validationError && (
        <Alert variant="destructive" className="py-2.5 px-3 rounded-xl shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-xs font-medium">
              {validationError}
            </AlertDescription>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 p-1 rounded-md transition-colors shrink-0"
            aria-label="Dismiss error"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </Alert>
      )}

      {/* SECTION 1: PATIENT CLINICAL DETAILS & INPUT FIELDS (FIRST SECTION) */}
      <section className="space-y-1.5">
        <PatientContextForm
          patient={draftPatient}
          onChange={(updated) => updateDraftPatient(updated)}
          disabled={isExtracting}
        />
      </section>

      {/* SECTION 2: PRESCRIPTION INTAKE SOURCE (UPLOAD OR MANUAL NOTES) */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <Tabs
          value={draftSourceType}
          onValueChange={(val) => setDraftSourceType(val as "upload" | "manual")}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-slate-200 bg-slate-50/50 p-0 h-11">
            <TabsTrigger
              value="upload"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0D607B] data-[state=active]:border-b-2 data-[state=active]:border-[#169781] rounded-none h-full"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Prescription Slip (Optional)</span>
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0D607B] data-[state=active]:border-b-2 data-[state=active]:border-[#169781] rounded-none h-full"
            >
              <FileText className="w-4 h-4" />
              <span>Type Prescription Notes (Optional)</span>
            </TabsTrigger>
          </TabsList>

          <div className="p-4 sm:p-5">
            {draftSourceType === "upload" ? (
              <PrescriptionUpload disabled={isExtracting} />
            ) : (
              <PrescriptionTextInput
                value={draftText}
                onChange={setDraftText}
                onLoadSample={() => {
                  loadDraftPreset(CLINICAL_SAMPLE_PRESETS[0]);
                  setValidationError(null);
                }}
                disabled={isExtracting}
              />
            )}
          </div>
        </Tabs>
      </section>

      {/* Extraction Processing State Overlay */}
      {isExtracting && (
        <LoadingState
          message="Preparing clinical prescription case..."
          subMessage="Parsing clinical entities, patient parameters, and regimen details via ICMR/WHO safety engine"
        />
      )}

      {/* FLOATING FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-[#169781] shrink-0" />
            <span>
              Slip upload is optional. Click proceed to verify medications and evaluate clinical guidelines.
            </span>
          </div>

          <CTAButton
            type="button"
            onClick={handleExtract}
            isLoading={isExtracting}
            loadingText={draftFile ? "Reading Slip..." : draftText.trim() ? "Reading Notes..." : "Processing Case..."}
            iconRight={ArrowRight}
            className="gap-2 px-6 py-2.5 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-[1.01] shrink-0"
          >
            {draftFile || draftText.trim() ? "Extract Prescription & Review Medicines" : "Proceed to Review Medicines"}
          </CTAButton>
        </div>
      </div>
    </div>
  );
}

export default function NewPrescriptionPage() {
  return (
    <AppShell title="New Prescription">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-400">
            Loading workspace...
          </div>
        }
      >
        <NewPrescriptionContent />
      </Suspense>
    </AppShell>
  );
}
