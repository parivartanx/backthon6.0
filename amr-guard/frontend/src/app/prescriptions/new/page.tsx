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

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

        {/* Clinical Sample Scenario Selector (Shadcn UI Select) */}
        <div className="flex items-center gap-2 bg-[#F1F8FC] border border-[#C9E9EB] p-1.5 rounded-xl self-start md:self-auto">
          <FlaskConical className="w-4 h-4 text-[#169781] ml-2 shrink-0" />
          <span className="text-xs font-semibold text-[#0D607B] hidden sm:inline">
            Load Sample:
          </span>
          <div className="w-64">
            <Select
              value={selectedPresetId}
              onValueChange={(val: string | null) => {
                if (val) {
                  const p = CLINICAL_SAMPLE_PRESETS.find((x) => x.id === val);
                  if (p) handleSelectPreset(p);
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                <SelectValue placeholder="Select realistic OPD case..." />
              </SelectTrigger>
              <SelectContent>
                {CLINICAL_SAMPLE_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <AlertDescription className="text-xs ml-2 font-medium">{validationError}</AlertDescription>
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
              <span>Enter Prescription Text</span>
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
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

        <Button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting}
          className="gap-2 px-6 py-2.5 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-semibold shadow-xs"
        >
          <span>Extract Prescription Details</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
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
