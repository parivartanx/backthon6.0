"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WorkflowStepper } from "@/components/common/WorkflowStepper";
import { PrescriptionUpload } from "@/components/prescriptions/PrescriptionUpload";
import { PrescriptionTextInput } from "@/components/prescriptions/PrescriptionTextInput";
import { PatientContextForm } from "@/components/prescriptions/PatientContextForm";
import { LoadingState } from "@/components/common/LoadingState";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { CLINICAL_SAMPLE_PRESETS, ClinicalSamplePreset } from "@/lib/clinicalSamples";
import { 
  FileText, 
  UploadCloud, 
  FlaskConical, 
  ArrowRight, 
  AlertCircle,
  Info
} from "lucide-react";

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

  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  // Sync query params (e.g. /prescriptions/new?tab=manual)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "manual" || tabParam === "upload") {
      setDraftSourceType(tabParam);
    }
  }, [searchParams, setDraftSourceType]);

  const handleSelectPreset = (preset: ClinicalSamplePreset) => {
    setSelectedPresetId(preset.id);
    loadDraftPreset(preset);
    setValidationError(null);
  };

  const handleExtract = async () => {
    setValidationError(null);

    // Validation gates
    if (!draftPatient.caseId.trim()) {
      setValidationError("Patient / Case ID is required.");
      return;
    }
    if (draftPatient.age === "" || Number(draftPatient.age) < 0) {
      setValidationError("A valid patient age is required.");
      return;
    }
    if (!draftPatient.symptoms.trim()) {
      setValidationError("Presenting symptoms / chief complaint are required.");
      return;
    }
    if (draftSourceType === "manual" && !draftText.trim()) {
      setValidationError("Please enter prescription text or load a clinical sample.");
      return;
    }
    if (draftSourceType === "upload" && !draftFile && !draftPreviewUrl) {
      setValidationError("Please select or drop a prescription image.");
      return;
    }

    try {
      const createdCase = await extractAndCreateCase();
      router.push(`/prescriptions/${encodeURIComponent(createdCase.id)}/verify`);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Extraction failed");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Stepper: Step 1 active */}
      <WorkflowStepper currentStep={1} />

      {/* Screen Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0D607B] tracking-tight">
            New Prescription Intake Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Digitize handwritten OPD slips or enter medication regimens for clinical data extraction
          </p>
        </div>

        {/* Clinical Sample Scenario Selector */}
        <div className="flex items-center gap-2 bg-[#F1F8FC] border border-[#C9E9EB] p-1.5 rounded-xl self-start md:self-auto">
          <FlaskConical className="w-4 h-4 text-[#169781] ml-2 shrink-0" />
          <span className="text-xs font-semibold text-[#0D607B] hidden sm:inline">
            Load Clinical Sample:
          </span>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const p = CLINICAL_SAMPLE_PRESETS.find((x) => x.id === e.target.value);
              if (p) handleSelectPreset(p);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#169781]"
          >
            <option value="">Select realistic OPD case...</option>
            {CLINICAL_SAMPLE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Input Methods Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setDraftSourceType("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              draftSourceType === "upload"
                ? "border-[#169781] text-[#0D607B] bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Prescription Image</span>
          </button>

          <button
            type="button"
            onClick={() => setDraftSourceType("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              draftSourceType === "manual"
                ? "border-[#169781] text-[#0D607B] bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Enter Prescription Text</span>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {draftSourceType === "upload" ? (
            <PrescriptionUpload disabled={isExtracting} />
          ) : (
            <PrescriptionTextInput
              value={draftText}
              onChange={setDraftText}
              onLoadSample={() => handleSelectPreset(CLINICAL_SAMPLE_PRESETS[0])}
              disabled={isExtracting}
            />
          )}
        </div>
      </div>

      {/* Patient Context Form */}
      <PatientContextForm
        patient={draftPatient}
        onChange={(updated) => updateDraftPatient(updated)}
        disabled={isExtracting}
      />

      {/* Extraction Processing State */}
      {isExtracting && (
        <LoadingState
          message="Extracting clinical prescription parameters..."
          subMessage="Identifying antimicrobial molecules, strengths, frequencies, routes and durations"
        />
      )}

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-[#169781] shrink-0" />
          <span>
            Phase 1 parses prescription entities into a structured, editable clinical table for verification.
          </span>
        </div>

        <button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <span>Extract Prescription Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function NewPrescriptionPage() {
  return (
    <AppShell
      title="New Prescription Intake"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "New Prescription" },
      ]}
    >
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading workspace...</div>}>
        <NewPrescriptionContent />
      </Suspense>
    </AppShell>
  );
}
