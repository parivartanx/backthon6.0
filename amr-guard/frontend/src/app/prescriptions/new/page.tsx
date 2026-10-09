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
    if (!draftPatient.symptoms.trim()) {
      const msg = "Presenting symptoms or diagnosis syndrome are required.";
      setValidationError(msg);
      showError({
        title: "Clinical Indication Required",
        message: msg,
        hint: "Provide clinical diagnosis to verify antibiotic indication under ICMR STG guidelines.",
      });
      return;
    }
    if (draftSourceType === "manual" && !draftText.trim()) {
      const msg = "Please enter prescription text or load a clinical sample.";
      setValidationError(msg);
      showError({
        title: "Prescription Text Empty",
        message: msg,
        hint: "Type drug name, strength, frequency, and duration.",
      });
      return;
    }
    if (draftSourceType === "upload" && !draftFile && !draftPreviewUrl) {
      const msg = "Please select or drop a prescription image.";
      setValidationError(msg);
      showError({
        title: "Prescription Slip Required",
        message: msg,
        hint: "Upload a photo or scanned copy of the outpatient slip (JPG, PNG, WebP).",
      });
      return;
    }

    try {
      // Execute Real API Extraction through Zustand & Network Layer
      const createdCase = await extractAndCreateCase();

      // Trigger Global Success Dialog with Clear Proceed CTA
      showSuccess({
        title: "Prescription Successfully Extracted",
        message: `Extracted ${createdCase.medicines.length} medication(s) for patient ${createdCase.patient.caseId}. Clinical entities have been parsed and are ready for physician review.`,
        details: createdCase.medicines.map((m) => `• ${m.brandName} (${m.genericName}) ${m.strength} ${m.frequency} x ${m.duration}`).join("\n"),
        primaryLabel: "Proceed to Review Medicines",
        onPrimary: () => {
          router.push(`/prescriptions/${encodeURIComponent(createdCase.id)}/verify`);
        },
      });
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header with Shadcn Breadcrumbs + Back Arrow */}
      <PageHeader
        title="New Prescription"
        description="Enter patient details and prescription, then verify medications before safety review."
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
        <Alert variant="destructive" className="py-3 rounded-xl shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <AlertDescription className="text-xs ml-2 font-medium">
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Input Methods Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <Tabs
          value={draftSourceType}
          onValueChange={(val) => setDraftSourceType(val as "upload" | "manual")}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-slate-200 bg-slate-50/50 p-0 h-12">
            <TabsTrigger
              value="upload"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0D607B] data-[state=active]:border-b-2 data-[state=active]:border-[#169781] rounded-none h-full"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Prescription Image</span>
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0D607B] data-[state=active]:border-b-2 data-[state=active]:border-[#169781] rounded-none h-full"
            >
              <FileText className="w-4 h-4" />
              <span>Type Prescription Text</span>
            </TabsTrigger>
          </TabsList>

          <div className="p-5 sm:p-6">
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
      </div>

      {/* Patient Context Form */}
      <PatientContextForm
        patient={draftPatient}
        onChange={(updated) => updateDraftPatient(updated)}
        disabled={isExtracting}
      />

      {/* Extraction Processing State Overlay */}
      {isExtracting && (
        <LoadingState
          message="Connecting to clinical extraction engine..."
          subMessage="Parsing patient demographics, drug names, dosage, frequency, and duration via NLP & Vision OCR"
        />
      )}

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-[#169781] shrink-0" />
          <span>
            Your prescription will be processed via real API, followed by verification before the 5-tier safety check.
          </span>
        </div>

        {/* CTA Button with Circular Progress Indicator */}
        <CTAButton
          type="button"
          onClick={handleExtract}
          isLoading={isExtracting}
          loadingText="Reading & Extracting Medicines..."
          iconRight={ArrowRight}
          className="gap-2 px-6 py-2.5 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-[1.01] shrink-0"
        >
          Read Prescription & Review Medicines
        </CTAButton>
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
