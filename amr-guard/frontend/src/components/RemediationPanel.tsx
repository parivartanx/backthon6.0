// [SOLID: SRP & Clean Architecture] Clinical Remediation & Guideline Alternative Selection Panel
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
  Sparkles,
  ArrowLeftRight
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
    "Culture sensitivity isolated susceptible pathogen.",
    "Documented allergy/anaphylaxis to first-line penicillin.",
    "Infectious disease specialist consultation approved broad therapy.",
    "Prior treatment failure on first-line Access regimen.",
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
      <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center space-y-2.5">
        <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-emerald-900">Clinical Review Complete</h4>
        <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
          This prescription strictly complies with ICMR and WHO Access guidelines. Recommended first-line treatment and course duration are fully verified.
        </p>
      </div>
    );
  }

  // Doctor-friendly categorization
  const typeConfig: Record<
    string,
    { label: string; icon: typeof RefreshCw; badgeClass: string }
  > = {
    SWITCH_DRUG: {
      label: "Recommended Alternative (First-Line)",
      icon: RefreshCw,
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    },
    DISCONTINUE: {
      label: "Discontinue Antibiotic (Supportive Care)",
      icon: Ban,
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    },
    REDUCE_DURATION: {
      label: "Optimize Course Duration",
      icon: Clock,
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    },
    MANDATE_SYMPTOMATIC: {
      label: "Supportive Symptomatic Care",
      icon: Stethoscope,
      badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    },
    MICROBIOLOGY_REQUIRED: {
      label: "Culture & Sensitivity Test Needed",
      icon: FlaskConical,
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    },
    CONTRAINDICATION_BLOCK: {
      label: "Safety Halt: Guideline Contraindication",
      icon: Ban,
      badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
    },
  };

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#0D607B]">
              Guideline Alternatives &amp; Clinical Remediation
            </h3>
            <Badge variant="outline" className="text-[10px] font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
              {options.length} {options.length === 1 ? "Option" : "Options"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare flagged medication with verified ICMR / WHO first-line alternatives and select your clinical action.
          </p>
        </div>

        {onExploreMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExploreMore}
            disabled={isLoadingMore}
            className="h-8 text-xs px-3 text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC]"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isLoadingMore ? "animate-spin text-[#169781]" : "text-[#169781]"}`} />
            <span>{isLoadingMore ? "Consulting Engine..." : "Explore More Alternatives"}</span>
          </Button>
        )}
      </div>

      {/* Active Clinical Override Banner (if retained with rationale) */}
      {clinicalOverride && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              Prescription Retained with Documented Clinical Rationale
            </span>
            <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 font-semibold">
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

      {/* Official First-line Protocol Reference */}
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
        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed italic">
          &quot;{stewardshipGuidance}&quot;
        </p>
      )}

      {/* Remediation Options List */}
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
              className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#169781]/40 shadow-2xs space-y-4 transition-all"
            >
              {/* Card Header: Type Badge + Guideline Reference */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                <Badge variant="outline" className={`gap-1.5 text-[11px] px-2.5 py-1 font-bold ${cfg.badgeClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                </Badge>
                
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>{opt.source_citation || "ICMR STG / WHO AWaRe Guidelines"}</span>
                </div>
              </div>

              {/* Side-by-Side Comparison: Current Flagged vs Proposed Alternative */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Left: Original Prescribed (Flagged) */}
                <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Current Prescribed
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-rose-100 text-rose-800 border-rose-200 font-semibold">
                      {originalMedicine?.aware_tier ? `${originalMedicine.aware_tier} Tier` : "Flagged"}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {originalMedicine ? `${originalMedicine.genericName || originalMedicine.brandName} ${originalMedicine.dose || ""}` : (matchingFlag?.drug || "Prescribed Molecule")}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Course: <span className="font-semibold text-slate-800">{originalMedicine?.duration || "10 days"}</span>
                    </div>
                  </div>
                  {matchingFlag && (
                    <div className="text-[11px] text-rose-800 bg-white/90 p-2 rounded-lg border border-rose-100 leading-snug">
                      <strong>Flagged:</strong> {matchingFlag.rule_name}
                    </div>
                  )}
                </div>

                {/* Right: Proposed Guideline Alternative */}
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Recommended First-Line
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
                      Access (Safe Choice)
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-950">
                      {opt.suggested_drug || (firstLineRegimen || "Standard First-Line Regimen")}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Target Course: <span className="font-semibold text-emerald-900">{opt.suggested_duration_days ? `${opt.suggested_duration_days} days` : "3 – 5 days"}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-800 bg-white/90 p-2 rounded-lg border border-emerald-100 leading-snug">
                    <strong>Clinical Benefit:</strong> First-line ICMR recommendation; targeted efficacy with low resistance risk.
                  </div>
                </div>
              </div>

              {/* Clinical Explanation in Plain Language */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-[#0D607B] uppercase tracking-wider block">
                  Why this change is advised:
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

              {/* Doctor Actions Toolbar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Select Action:
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Action 1: Retain with Documented Rationale */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRetainDialog(opt)}
                    className="h-8 text-xs gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50"
                    title="Keep prescribed medicine and document clinical justification"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Keep Current (Add Reason)</span>
                  </Button>

                  {/* Action 2: Modify Regimen */}
                  {onModify && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onModify(opt)}
                      className="h-8 text-xs gap-1.5 text-slate-700 hover:text-[#0D607B] hover:border-[#0D607B]/40"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Adjust Dose / Days</span>
                    </Button>
                  )}

                  {/* Action 3: Accept Recommendation (Primary CTA) */}
                  {onApply && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onApply(opt)}
                      className="h-8 text-xs gap-1.5 bg-[#169781] hover:bg-[#117866] text-white font-semibold shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Recommended Alternative</span>
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
              Guideline safety alerts flagged this antimicrobial. If you choose to retain it based on microbiology sensitivity, patient history, or specialist consensus, document your justification for the audit trail.
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
                placeholder="E.g., Culture sensitivity demonstrated resistance to first-line agents. Targeted therapy initiated."
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
              Confirm &amp; Retain with Rationale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
