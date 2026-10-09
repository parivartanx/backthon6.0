// [SOLID: SRP & Clean Architecture] Stage 6: Remediation & Prescription Review Panel
"use client";

import React, { useState } from "react";
import { 
  RemediationOption, 
  RuleViolation, 
  MedicineEntry, 
  ClinicalOverride 
} from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  RefreshCw, 
  Ban, 
  Clock, 
  Stethoscope, 
  FlaskConical, 
  BookOpen,
  ArrowRight,
  Edit3,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  Sparkles,
  Info
} from "lucide-react";

interface RemediationPanelProps {
  options: RemediationOption[];
  flags?: RuleViolation[];
  medicines?: MedicineEntry[];
  clinicalOverride?: ClinicalOverride;
  firstLineRegimen?: string;
  stewardshipGuidance?: string;
  onApply?: (option: RemediationOption) => void;
  onModify?: (option: RemediationOption) => void;
  onRetainWithRationale?: (rationale: string, retainedDrug?: string) => void;
  onExploreMore?: () => void;
  isLoadingMore?: boolean;
}

export function RemediationPanel({ 
  options, 
  flags = [],
  medicines = [],
  clinicalOverride,
  firstLineRegimen,
  stewardshipGuidance,
  onApply,
  onModify,
  onRetainWithRationale,
  onExploreMore,
  isLoadingMore = false,
}: RemediationPanelProps) {
  // Doctor Retain with Rationale Dialog State
  const [isRetainDialogOpen, setIsRetainDialogOpen] = useState(false);
  const [selectedOptionForRetain, setSelectedOptionForRetain] = useState<RemediationOption | null>(null);
  const [doctorRationale, setDoctorRationale] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Ananya Sharma, MD");
  const [rationaleError, setRationaleError] = useState<string | null>(null);

  // Common clinical justification presets
  const clinicalPresets = [
    "Microbiology culture sensitivity isolated susceptible pathogen.",
    "Documented severe anaphylaxis/allergy to first-line penicillin/cephalosporin.",
    "Infectious disease specialist consultation approved broad-spectrum therapy.",
    "Treatment failure on prior first-line Access regimen; escalation indicated.",
  ];

  const handleOpenRetainDialog = (opt: RemediationOption) => {
    setSelectedOptionForRetain(opt);
    setDoctorRationale("");
    setRationaleError(null);
    setIsRetainDialogOpen(true);
  };

  const handleConfirmRetain = () => {
    if (!doctorRationale.trim()) {
      setRationaleError("Please enter a clinical justification before retaining this medication.");
      return;
    }
    if (onRetainWithRationale) {
      const targetDrug = 
        flags.find(f => f.drug)?.drug ||
        selectedOptionForRetain?.suggested_drug ||
        medicines[0]?.genericName || 
        "Prescribed antimicrobial";
      onRetainWithRationale(doctorRationale.trim(), targetDrug);
    }
    setIsRetainDialogOpen(false);
  };

  if (!options || options.length === 0) {
    return (
      <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-emerald-900">Stage 6: Clinical Review Complete</h4>
        <p className="text-[11px] text-emerald-700 max-w-sm mx-auto">
          Prescription strictly complies with first-line ICMR guidelines and recommended course durations. No substitutions or modifications required.
        </p>
      </div>
    );
  }

  const typeConfig: Record<
    string,
    { label: string; icon: typeof RefreshCw; badgeClass: string }
  > = {
    SWITCH_DRUG: {
      label: "De-escalate / Switch Agent",
      icon: RefreshCw,
      badgeClass: "bg-blue-100 text-blue-900 border-blue-200",
    },
    DISCONTINUE: {
      label: "Discontinue Antimicrobial",
      icon: Ban,
      badgeClass: "bg-red-100 text-red-900 border-red-200",
    },
    REDUCE_DURATION: {
      label: "Reduce Course Duration",
      icon: Clock,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    },
    MANDATE_SYMPTOMATIC: {
      label: "Supportive Symptomatic Care",
      icon: Stethoscope,
      badgeClass: "bg-teal-100 text-teal-900 border-teal-200",
    },
    MICROBIOLOGY_REQUIRED: {
      label: "Microbiology ID Mandated",
      icon: FlaskConical,
      badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    },
    CONTRAINDICATION_BLOCK: {
      label: "Emergency Halt / Block",
      icon: Ban,
      badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
    },
  };

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#169781] tracking-wider uppercase bg-[#E2FAD9] px-2 py-0.5 rounded">
              Stage 6
            </span>
            <h3 className="text-sm font-bold text-[#0D607B]">
              Remediation & Prescription Review
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Compare original prescription against verified guideline alternatives and choose doctor action
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onExploreMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExploreMore}
              disabled={isLoadingMore}
              className="h-6 text-[10px] px-2.5 text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC]"
            >
              <Sparkles className={`w-3 h-3 mr-1 ${isLoadingMore ? "animate-spin" : ""}`} />
              <span>{isLoadingMore ? "Consulting Engine..." : "Explore Alternatives"}</span>
            </Button>
          )}
          <Badge variant="outline" className="text-[10px] font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
            {options.length} {options.length === 1 ? "Intervention" : "Interventions"}
          </Badge>
        </div>
      </div>

      {/* Active Clinical Override Banner (if retained with rationale) */}
      {clinicalOverride && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              Prescription Retained with Documented Clinical Rationale
            </span>
            <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300">
              Doctor Override Active
            </Badge>
          </div>
          <p className="text-xs text-amber-800 italic pl-5">
            &quot;{clinicalOverride.rationale}&quot;
          </p>
          <div className="text-[10px] text-amber-700/80 pl-5 flex items-center gap-2">
            <span>Clinician: <strong>{clinicalOverride.doctorName}</strong></span>
            <span>•</span>
            <span>Recorded: {new Date(clinicalOverride.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      )}

      {/* First-line Protocol Reference */}
      {firstLineRegimen && (
        <div className="p-3 bg-[#F1F8FC] border border-[#C9E9EB] rounded-xl flex items-start gap-2.5 text-xs">
          <BookOpen className="w-4 h-4 text-[#169781] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#0D607B] block">Official First-Line Regimen (ICMR STG):</span>
            <span className="text-slate-700 font-medium">{firstLineRegimen}</span>
          </div>
        </div>
      )}

      {stewardshipGuidance && (
        <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed italic">
          &quot;{stewardshipGuidance}&quot;
        </p>
      )}

      {/* Remediation Cards List */}
      <div className="space-y-4">
        {options.map((opt, idx) => {
          const cfg = typeConfig[opt.recommendation_type] || {
            label: opt.recommendation_type,
            icon: Stethoscope,
            badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
          };
          const Icon = cfg.icon;

          // Find corresponding flag or original medicine for this option
          const matchingFlag = flags.find(f => 
            (f.drug && opt.guidance.toLowerCase().includes(f.drug.toLowerCase())) ||
            (f.remediation && f.remediation.toLowerCase().includes(opt.suggested_drug?.toLowerCase() || ""))
          ) || flags[idx] || flags[0];

          const originalMedicine = medicines.find(m => 
            matchingFlag?.drug && (
              m.genericName.toLowerCase().includes(matchingFlag.drug.toLowerCase()) ||
              m.brandName.toLowerCase().includes(matchingFlag.drug.toLowerCase())
            )
          ) || medicines[0];

          return (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#169781]/40 shadow-xs space-y-3.5 transition-all"
            >
              {/* Card Header: Type Badge + Guideline Reference */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
                <Badge variant="outline" className={`gap-1.5 text-[10px] px-2.5 py-0.5 font-bold ${cfg.badgeClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                </Badge>
                
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  <span>{opt.source_citation || "ICMR STG / WHO AWaRe 2023"}</span>
                </div>
              </div>

              {/* SIDE-BY-SIDE REGIMEN COMPARISON (Original vs Proposed Alternative) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Left: Original Prescribed */}
                <div className="p-3 rounded-lg bg-rose-50/40 border border-rose-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Original Prescription
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-rose-100 text-rose-800 border-rose-200">
                      {originalMedicine?.aware_tier ? `${originalMedicine.aware_tier} Tier` : "Flagged"}
                    </Badge>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {originalMedicine ? `${originalMedicine.genericName || originalMedicine.brandName} ${originalMedicine.dose || ""}` : (matchingFlag?.drug || "Prescribed Molecule")}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Duration: <span className="font-semibold text-slate-800">{originalMedicine?.duration || "10-14 days"}</span>
                  </div>
                  {matchingFlag && (
                    <div className="text-[10px] text-rose-700 bg-white/80 p-1.5 rounded border border-rose-100 leading-tight">
                      <strong>Flag:</strong> {matchingFlag.rule_name}
                    </div>
                  )}
                </div>

                {/* Right: Proposed Guideline Alternative */}
                <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Proposed Alternative
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-100 text-emerald-800 border-emerald-200">
                      Access (First-Line)
                    </Badge>
                  </div>
                  <div className="text-xs font-bold text-emerald-950">
                    {opt.suggested_drug || (firstLineRegimen || "Standard Access Regimen")}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Target Duration: <span className="font-semibold text-emerald-900">{opt.suggested_duration_days ? `${opt.suggested_duration_days} days` : "3 – 5 days"}</span>
                  </div>
                  <div className="text-[10px] text-emerald-800 bg-white/80 p-1.5 rounded border border-emerald-100 leading-tight">
                    <strong>Benefit:</strong> Minimizes resistance, avoids organ toxicity & aligns with ICMR
                  </div>
                </div>
              </div>

              {/* Explanation of Why Change is Needed */}
              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-[#0D607B] uppercase tracking-wider block">
                  Clinical Rationale for Intervention:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {opt.guidance}
                </p>
                {matchingFlag?.rationale && matchingFlag.rationale !== opt.guidance && (
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                    {matchingFlag.rationale}
                  </p>
                )}
              </div>

              {/* DOCTOR ACTIONS TOOLBAR */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Doctor Actions:
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Action 3: Retain with Documented Rationale */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRetainDialog(opt)}
                    className="h-7 text-xs gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50"
                    title="Document clinical justification to retain current prescription"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Retain with Rationale</span>
                  </Button>

                  {/* Action 2: Modify Regimen */}
                  {onModify && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onModify(opt)}
                      className="h-7 text-xs gap-1.5 text-slate-700 hover:text-[#0D607B] hover:border-[#0D607B]/40"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modify Regimen</span>
                    </Button>
                  )}

                  {/* Action 1: Accept Recommendation */}
                  {onApply && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onApply(opt)}
                      className="h-7 text-xs gap-1.5 bg-[#169781] hover:bg-[#117866] text-white font-semibold shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Recommendation</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Retain with Documented Rationale Dialog */}
      <Dialog open={isRetainDialogOpen} onOpenChange={setIsRetainDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Retain Prescription with Clinical Justification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Guideline safety alerts flagged this antimicrobial. If you choose to retain it based on diagnostic findings, patient sensitivities, or specialist consensus, document your justification for the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Attending Physician Name
              </label>
              <Input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Full Name"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Quick Clinical Presets (Click to insert)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {clinicalPresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setDoctorRationale(preset)}
                    className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1 text-left transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Documented Clinical Rationale <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={3}
                value={doctorRationale}
                onChange={(e) => {
                  setDoctorRationale(e.target.value);
                  setRationaleError(null);
                }}
                placeholder="E.g., Isolated Klebsiella pneumoniae on urine culture resistant to first-line agents. Patient initiated on targeted therapy per antibiogram."
                className="text-xs"
              />
              {rationaleError && (
                <p className="text-[11px] text-rose-600 mt-1">{rationaleError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRetainDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRetain}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Confirm & Retain with Rationale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
