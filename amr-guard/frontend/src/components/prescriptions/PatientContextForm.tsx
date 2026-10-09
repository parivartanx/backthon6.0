"use client";

import { PatientContext, SexOption, PregnancyStatusOption } from "@/types/prescription";
import { User, ShieldAlert, FileText, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PatientContextFormProps {
  patient: PatientContext;
  onChange: (updated: PatientContext) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function PatientContextForm({
  patient,
  onChange,
  errors = {},
  disabled = false,
}: PatientContextFormProps) {
  const updateField = <K extends keyof PatientContext>(key: K, value: PatientContext[K]) => {
    onChange({
      ...patient,
      [key]: value,
    });
  };

  const isAllergySensitive =
    patient.allergies &&
    patient.allergies.trim().length > 0 &&
    !patient.allergies.toLowerCase().includes("none") &&
    !patient.allergies.toLowerCase().includes("nkda") &&
    !patient.allergies.toLowerCase().includes("nil");

  return (
    <Card className="bg-white border-slate-200/90 shadow-2xs">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-[#0D607B]">Patient Clinical Context</CardTitle>
            <CardDescription className="text-[11px] text-slate-500">
              Required parameters for safe antimicrobial interpretation and dosage evaluation
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Row 1: Identification, Age, Sex, Pregnancy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Case ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Case / Patient ID <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={patient.caseId}
              onChange={(e) => updateField("caseId", e.target.value)}
              disabled={disabled}
              placeholder="e.g. CASE-2026-0895"
              className={`h-9 text-xs bg-white ${
                errors.caseId
                  ? "border-red-400 focus-visible:ring-red-200"
                  : "border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
              }`}
            />
            {errors.caseId && <p className="mt-1 text-[11px] text-red-600">{errors.caseId}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Age (Years) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              max="125"
              value={patient.age === "" ? "" : patient.age}
              onChange={(e) => {
                const val = e.target.value;
                updateField("age", val === "" ? "" : Math.max(0, parseInt(val, 10) || 0));
              }}
              disabled={disabled}
              placeholder="e.g. 34"
              className={`h-9 text-xs bg-white ${
                errors.age
                  ? "border-red-400 focus-visible:ring-red-200"
                  : "border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
              }`}
            />
            {errors.age && <p className="mt-1 text-[11px] text-red-600">{errors.age}</p>}
          </div>

          {/* Sex */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biological Sex <span className="text-red-500">*</span>
            </label>
            <select
              value={patient.sex}
              onChange={(e) => updateField("sex", e.target.value as SexOption)}
              disabled={disabled}
              className={`w-full px-3 h-9 text-xs rounded-md border bg-white focus:outline-none focus:ring-1 focus:ring-[#169781] transition-all ${
                errors.sex
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300"
              }`}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to specify">Prefer not to specify</option>
            </select>
            {errors.sex && <p className="mt-1 text-[11px] text-red-600">{errors.sex}</p>}
          </div>

          {/* Pregnancy Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pregnancy Status
            </label>
            <select
              value={patient.pregnancyStatus}
              onChange={(e) =>
                updateField("pregnancyStatus", e.target.value as PregnancyStatusOption)
              }
              disabled={disabled || patient.sex === "Male"}
              className="w-full px-3 h-9 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#169781] transition-all disabled:bg-slate-50 disabled:opacity-60"
            >
              <option value="Not applicable">Not applicable</option>
              <option value="Not pregnant">Not pregnant</option>
              <option value="Pregnant">Pregnant (High vigilance)</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Row 2: Allergies & Symptoms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Known Drug Allergies */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Known Drug Allergies</span>
              </label>
              <span className="text-[10px] text-slate-400">e.g. Penicillin, Sulfa, NSAIDs</span>
            </div>
            <Input
              type="text"
              value={patient.allergies}
              onChange={(e) => updateField("allergies", e.target.value)}
              disabled={disabled}
              placeholder="Type allergies or enter 'NKDA' if none known"
              className={`h-9 text-xs bg-white ${
                isAllergySensitive
                  ? "border-amber-400 bg-amber-50/30 text-amber-900 focus-visible:ring-amber-200"
                  : "border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
              }`}
            />
            {isAllergySensitive && (
              <Alert className="py-2 px-3 border-amber-300 bg-amber-50/60 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <AlertDescription className="text-[11px] font-medium ml-2">
                  Allergy recorded: will trigger contraindication checks during audit
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Presenting Symptoms */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Presenting Symptoms & Chief Complaints <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={patient.symptoms}
              onChange={(e) => updateField("symptoms", e.target.value)}
              disabled={disabled}
              placeholder="e.g. High fever x 3 days, purulent productive cough, dysuria"
              className={`h-9 text-xs bg-white ${
                errors.symptoms
                  ? "border-red-400 focus-visible:ring-red-200"
                  : "border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
              }`}
            />
            {errors.symptoms && <p className="text-[11px] text-red-600">{errors.symptoms}</p>}
          </div>
        </div>

        {/* Row 3: Medical History & Suspected Diagnosis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relevant Medical History / Comorbidities
            </label>
            <Input
              type="text"
              value={patient.medicalHistory}
              onChange={(e) => updateField("medicalHistory", e.target.value)}
              disabled={disabled}
              placeholder="e.g. Type 2 Diabetes, chronic renal impairment, mild asthma"
              className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#0D607B]" />
                <span>Suspected Diagnosis</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Clinician impression</span>
            </label>
            <Input
              type="text"
              value={patient.suspectedDiagnosis}
              onChange={(e) => updateField("suspectedDiagnosis", e.target.value)}
              disabled={disabled}
              placeholder="e.g. Community-Acquired Pneumonia (CAP) or Acute Bronchitis"
              className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
