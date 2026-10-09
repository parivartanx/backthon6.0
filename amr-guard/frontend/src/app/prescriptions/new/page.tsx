// [SOLID: SRP] Redesigned New Prescription Intake Workspace for AMR Sentinel
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WorkflowStepper } from "@/components/common/WorkflowStepper";
import { PrescriptionUpload } from "@/components/prescriptions/PrescriptionUpload";
import { ManualPrescriptionForm } from "@/components/prescriptions/ManualPrescriptionForm";
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
  Info,
  Sparkles,
  ShieldCheck,
  Stethoscope
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      setValidationError("Please enter prescription medication orders or load an OPD sample.");
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Stepper: Step 1 active */}
      <WorkflowStepper currentStep={1} />

      {/* Hero Header Card with Vector2 Bio-Helix Badge */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative gradient background */}
        <div className="absolute top-0 right-0 w-72 h-32 bg-gradient-to-l from-[#E2FAD9]/40 to-transparent pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D607B] to-[#169781] p-0.5 shadow-xs shrink-0 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vector2.jpeg"
              alt="AMR Sentinel Bio-Helix"
              className="w-full h-full object-cover rounded-[14px] brightness-105 contrast-110"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0D607B] tracking-tight">
                New Prescription Intake Workspace
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 text-[10px] font-semibold gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#169781] animate-pulse" />
                <span>Intake Gate</span>
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Build a medication regimen with the interactive Rx builder or upload an outpatient slip for automated extraction.
            </p>
          </div>
        </div>

        {/* Clinical Sample Scenario Selector (Shadcn UI Select) */}
        <div className="flex items-center gap-2 bg-[#F1F8FC] border border-[#C9E9EB] p-1.5 rounded-2xl self-start md:self-auto shrink-0 shadow-2xs">
          <FlaskConical className="w-4 h-4 text-[#169781] ml-2 shrink-0" />
          <span className="text-xs font-semibold text-[#0D607B] hidden sm:inline">
            Load Sample Case:
          </span>
          <div className="w-56 sm:w-64">
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
        <Alert variant="destructive" className="py-3 shadow-2xs animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <AlertDescription className="text-xs ml-2 font-medium">{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Input Methods Tabs Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <Tabs
          value={draftSourceType}
          onValueChange={(val) => setDraftSourceType(val as "upload" | "manual")}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-slate-200 bg-slate-50/70 p-0 h-13">
            <TabsTrigger
              value="manual"
              className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#0D607B] data-[state=active]:border-b-2 data-[state=active]:border-[#169781] rounded-none h-full transition-all"
            >
              <FileText className="w-4 h-4 text-[#169781]" />
              <span>Structured Rx & Manual Input</span>
            </TabsTrigger>

            <TabsTrigger
              value="upload"
              className="gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#0D607B] data-[state=active]:border-b-2 data-[state=active]:border-[#169781] rounded-none h-full transition-all"
            >
              <UploadCloud className="w-4 h-4 text-[#0D607B]" />
              <span>Upload Prescription Scan</span>
            </TabsTrigger>
          </TabsList>

          <div className="p-5 sm:p-6">
            {draftSourceType === "manual" ? (
              <ManualPrescriptionForm
                draftText={draftText}
                onTextChange={setDraftText}
                onLoadSample={() => handleSelectPreset(CLINICAL_SAMPLE_PRESETS[0])}
                disabled={isExtracting}
              />
            ) : (
              <PrescriptionUpload disabled={isExtracting} />
            )}
          </div>
        </Tabs>
      </div>

      {/* Patient Clinical Vigilance Form */}
      <PatientContextForm
        patient={draftPatient}
        onChange={(updated) => updateDraftPatient(updated)}
        disabled={isExtracting}
      />

      {/* Extraction Processing State */}
      {isExtracting && (
        <LoadingState
          message="Extracting & normalizing clinical prescription entities..."
          subMessage="Classifying WHO AWaRe tiers, checking renal/age limits, and formatting for Five-Tier audit"
        />
      )}

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-[#169781] shrink-0" />
          <span>
            Next: Review extracted entities on Step 2 before initiating the deterministic Five-Tier audit.
          </span>
        </div>

        <Button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting}
          className="gap-2 px-6 h-10 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-[1.01] shrink-0"
        >
          {isExtracting ? (
            <span>Processing Intake...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Extract & Validate Prescription</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
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
      <Suspense fallback={
        <div className="max-w-md mx-auto my-16">
          <LoadingState message="Loading intake workspace..." />
        </div>
      }>
        <NewPrescriptionContent />
      </Suspense>
    </AppShell>
  );
}
