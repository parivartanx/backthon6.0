// [SOLID: SRP] Patient clinical safety form utilizing 100% Shadcn UI primitives
"use client";

import { PatientContext, SexOption, PregnancyStatusOption } from "@/types/prescription";
import { User, ShieldAlert, FileText, Activity, FlaskConical, Scale, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B]">
              <User className="w-4 h-4 text-[#169781]" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-[#0D607B]">
                Patient Details & Clinical Information
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Core parameters evaluated against ICMR Standard Treatment Guidelines & WHO AWaRe tiers
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#169781] animate-pulse" />
              <span>Dynamic Field Sync</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Row 1: Identification, Demographics, Age, Sex, Pregnancy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Patient Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Name
            </label>
            <Input
              type="text"
              value={patient.patientName || ""}
              onChange={(e) => updateField("patientName", e.target.value)}
              disabled={disabled}
              placeholder="e.g. Rahul Verma"
              className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
            />
          </div>

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
              className={`h-9 text-xs bg-white ${errors.caseId
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
              className={`h-9 text-xs bg-white ${errors.age
                  ? "border-red-400 focus-visible:ring-red-200"
                  : "border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
                }`}
            />
            {Number(patient.age) > 0 && Number(patient.age) < 18 && (
              <p className="mt-1 text-[10px] text-amber-600 font-medium">
                Pediatric safety rule: Fluoroquinolones & Tetracyclines prohibited under 18.
              </p>
            )}
            {errors.age && <p className="mt-1 text-[11px] text-red-600">{errors.age}</p>}
          </div>

          {/* Biological Sex (Shadcn UI Select) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biological Sex <span className="text-red-500">*</span>
            </label>
            <Select
              value={patient.sex}
              onValueChange={(val) => updateField("sex", (val as SexOption) || "Male")}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-300">
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to specify">Prefer not to specify</SelectItem>
              </SelectContent>
            </Select>
            {errors.sex && <p className="mt-1 text-[11px] text-red-600">{errors.sex}</p>}
          </div>

          {/* Pregnancy Status (Shadcn UI Select) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pregnancy Status
            </label>
            <Select
              value={patient.pregnancyStatus}
              onValueChange={(val) =>
                updateField("pregnancyStatus", (val as PregnancyStatusOption) || "Not applicable")
              }
              disabled={disabled || patient.sex === "Male"}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-300 disabled:opacity-50">
                <SelectValue placeholder="Pregnancy status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not applicable">Not applicable</SelectItem>
                <SelectItem value="Not pregnant">Not pregnant</SelectItem>
                <SelectItem value="Pregnant">Pregnant (High Risk)</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Weight & Renal Function (eGFR) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-[#0D607B]" />
              <span>Weight (kg)</span>
            </label>
            <Input
              type="number"
              min="1"
              max="300"
              value={patient.weight_kg === "" || patient.weight_kg === undefined ? "" : patient.weight_kg}
              onChange={(e) => {
                const val = e.target.value;
                updateField("weight_kg", val === "" ? "" : parseFloat(val) || "");
              }}
              disabled={disabled}
              placeholder="e.g. 68"
              className="h-8 text-xs bg-white border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#169781]" />
              <span>eGFR (mL/min)</span>
            </label>
            <Input
              type="number"
              min="0"
              max="200"
              value={patient.egfr === "" || patient.egfr === undefined ? "" : patient.egfr}
              onChange={(e) => {
                const val = e.target.value;
                updateField("egfr", val === "" ? "" : parseFloat(val) || "");
              }}
              disabled={disabled}
              placeholder="e.g. 85 (or <30 for renal guard)"
              className="h-8 text-xs bg-white border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-[#0D607B]" />
              <span>Culture Report</span>
            </label>
            <Select
              value={patient.has_culture_report ? "yes" : "no"}
              onValueChange={(val) => updateField("has_culture_report", val === "yes")}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                <SelectValue placeholder="Report available?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No (Empiric Therapy)</SelectItem>
                <SelectItem value="yes">Yes (Pathogen Sensitivities Available)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#169781]" />
              <span>Clinical Setting</span>
            </label>
            <Select
              value={patient.is_outpatient === false ? "inpatient" : "outpatient"}
              onValueChange={(val) => updateField("is_outpatient", val === "outpatient")}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                <SelectValue placeholder="Care setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outpatient">Outpatient (OPD)</SelectItem>
                <SelectItem value="inpatient">Inpatient (IPD / Ward)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Allergies & Symptoms */}
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
              className={`h-9 text-xs bg-white ${isAllergySensitive
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
              className={`h-9 text-xs bg-white ${errors.symptoms
                  ? "border-red-400 focus-visible:ring-red-200"
                  : "border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
                }`}
            />
            {errors.symptoms && <p className="text-[11px] text-red-600">{errors.symptoms}</p>}
          </div>
        </div>

        {/* Row 4: Medical History & Suspected Syndrome */}
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
                <span>Suspected Diagnosis / Canonical Syndrome</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">ICMR STG Code / Label</span>
            </label>
            <Input
              type="text"
              list="icmr-syndromes-datalist"
              value={patient.suspectedDiagnosis || ""}
              onChange={(e) => {
                const val = e.target.value;
                updateField("suspectedDiagnosis", val);
                const matched = ICMR_CANONICAL_SYNDROMES.find(
                  (s) => s.code.toLowerCase() === val.toLowerCase() || s.label.toLowerCase() === val.toLowerCase()
                );
                if (matched) {
                  updateField("canonical_syndrome", matched.code);
                } else if (val.trim().length > 1) {
                  updateField("canonical_syndrome", val);
                } else {
                  updateField("canonical_syndrome", "");
                }
              }}
              disabled={disabled}
              placeholder="Select or type: e.g. Community-Acquired Pneumonia (Mild Outpatient)"
              className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
            />
            <datalist id="icmr-syndromes-datalist">
              {ICMR_CANONICAL_SYNDROMES.map((syn) => (
                <option key={syn.code} value={syn.label}>
                  {syn.code}
                </option>
              ))}
            </datalist>
            {patient.canonical_syndrome && patient.canonical_syndrome.length > 1 && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                <span className="text-slate-400 text-[10px]">Mapped:</span>
                <span className="font-semibold text-[#0D607B] bg-[#F1F8FC] border border-[#C9E9EB] px-1.5 py-0.5 rounded text-[10px]">
                  {patient.canonical_syndrome}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ICMR_CANONICAL_SYNDROMES = [
  { code: "SYN_CAP_MILD", label: "Community-Acquired Pneumonia (Mild Outpatient)" },
  { code: "SYN_UNCOMPLICATED_UTI", label: "Uncomplicated Acute Cystitis / Lower UTI" },
  { code: "SYN_ACUTE_BRONCHITIS", label: "Acute Bronchitis (Self-Limiting Viral)" },
  { code: "SYN_COMMON_COLD", label: "Common Cold / Rhinopharyngitis (Viral)" },
  { code: "SYN_VIRAL_URTI", label: "Viral Upper Respiratory Tract Infection" },
  { code: "SYN_PHARYNGITIS_NON_STREP", label: "Non-Streptococcal Pharyngitis (Viral Sore Throat)" },
  { code: "SYN_WATERY_DIARRHEA", label: "Acute Watery Diarrhea (Non-Cholera)" },
  { code: "SYN_PHARYNGITIS_STREP", label: "Streptococcal Pharyngitis (Group A Strep)" },
  { code: "SYN_AOM", label: "Acute Otitis Media" },
  { code: "SYN_SSTI_UNCOMPLICATED", label: "Uncomplicated Skin and Soft Tissue Infection (Cellulitis / Impetigo)" },
  { code: "SYN_CAP_MODERATE", label: "Community-Acquired Pneumonia (Moderate Inpatient Ward)" },
  { code: "SYN_CAP_SEVERE", label: "Community-Acquired Pneumonia (Severe ICU)" },
  { code: "SYN_HAP", label: "Hospital-Acquired Pneumonia (Non-Ventilated)" },
  { code: "SYN_VAP", label: "Ventilator-Associated Pneumonia" },
  { code: "SYN_AECB", label: "Acute Exacerbation of Chronic Bronchitis / COPD" },
  { code: "SYN_ACUTE_RHINOSINUSITIS", label: "Acute Bacterial Rhinosinusitis (Persistent >10 Days)" },
  { code: "SYN_DENTAL_ABSCESS", label: "Odontogenic / Periapical Dental Abscess" },
  { code: "SYN_PYELONEPHRITIS_UNCOMPLICATED", label: "Acute Uncomplicated Pyelonephritis (Outpatient)" },
  { code: "SYN_ENTERIC_FEVER", label: "Enteric Fever / Typhoid (Salmonella enterica)" },
  { code: "SYN_DIABETIC_FOOT_MILD", label: "Diabetic Foot Infection (Mild Outpatient)" },
];
