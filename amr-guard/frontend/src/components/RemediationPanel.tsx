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
  ArrowLeftRight,
  Loader2,
  Sparkles,
  Info
} from "lucide-react";
import { SwitchMedicineDialog } from "@/components/remediation/SwitchMedicineDialog";

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

// [SOLID: SRP] Helper to determine if a medicine is a non-antimicrobial supportive therapy
export function isSupportiveMedicine(medicine?: MedicineEntry): boolean {
  if (!medicine) return false;
  const name = `${medicine.genericName || ""} ${medicine.brandName || ""}`.toLowerCase();
  const nonAntimicrobialTerms = [
    "diclofenac", "voveran", "ibuprofen", "combiflam", "naproxen", "paracetamol", 
    "dolo", "calpol", "crocin", "cetirizine", "cetzine", "1-al", "aceclofenac", 
    "zerodol", "pantoprazole", "omeprazole", "ranitidine", "salbutamol", "asthalin", 
    "ors", "zinc", "dextromethorphan", "nimesulide", "etoricoxib"
  ];
  return (
    medicine.drug_class === "NSAID" || 
    (medicine.aware_tier as string) === "Not Applicable" || 
    nonAntimicrobialTerms.some((t) => name.includes(t))
  );
}

// [SOLID: SRP] Clean therapeutic badge resolution preventing 'Unknown Tier' false alarms
export function getDrugClassificationBadge(medicine?: MedicineEntry) {
  if (!medicine) {
    return {
      label: "Flagged Regimen",
      className: "bg-rose-100 text-rose-800 border-rose-200 font-semibold",
      isSupportive: false,
    };
  }

  const name = `${medicine.genericName || ""} ${medicine.brandName || ""}`.toLowerCase();
  const nsaids = ["diclofenac", "voveran", "ibuprofen", "combiflam", "naproxen", "aceclofenac", "zerodol", "etoricoxib", "piroxicam", "nimesulide", "ketorolac", "mefenamic"];
  
  if (medicine.drug_class === "NSAID" || nsaids.some((n) => name.includes(n))) {
    return {
      label: "Supportive / NSAID",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold",
      isSupportive: true,
    };
  }

  const generalSupportive = ["paracetamol", "dolo", "crocin", "calpol", "cetirizine", "cetzine", "1-al", "pantoprazole", "omeprazole", "salbutamol", "ors", "zinc"];
  if (generalSupportive.some((g) => name.includes(g))) {
    return {
      label: "Supportive Therapy",
      className: "bg-teal-50 text-teal-700 border-teal-200 font-semibold",
      isSupportive: true,
    };
  }

  const tier = medicine.aware_tier?.toLowerCase();
  if (tier === "access") {
    return {
      label: "Access Tier",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold",
      isSupportive: false,
    };
  }
  if (tier === "watch") {
    return {
      label: "Watch Tier",
      className: "bg-amber-100 text-amber-800 border-amber-200 font-semibold",
      isSupportive: false,
    };
  }
  if (tier === "reserve") {
    return {
      label: "Reserve Tier",
      className: "bg-rose-100 text-rose-800 border-rose-200 font-bold",
      isSupportive: false,
    };
  }

  const supportive = isSupportiveMedicine(medicine);
  return {
    label: medicine.drug_class || (supportive ? "Supportive Care" : "Unclassified Agent"),
    className: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
    isSupportive: supportive,
  };
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
  const [isRetaining, setIsRetaining] = useState(false);

  // Switch Medication Confirmation Dialog State
  const [selectedOptionForSwitch, setSelectedOptionForSwitch] = useState<{
    option: RemediationOption;
    originalMedicine?: MedicineEntry;
    matchingFlag?: RuleViolation;
  } | null>(null);

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

  const handleConfirmRetain = async () => {
    if (!doctorRationale.trim()) {
      setRationaleError("Please enter a clinical justification before retaining this medication.");
      return;
    }
    try {
      setIsRetaining(true);
      if (onRetainWithRationale) {
        const targetDrug = 
          flags.find(f => f.drug)?.drug ||
          selectedOptionForRetain?.suggested_drug ||
          medicines[0]?.genericName || 
          "Prescribed antimicrobial";
        await onRetainWithRationale(doctorRationale.trim(), targetDrug);
      }
      setIsRetainDialogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetaining(false);
    }
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
    <div className="space-y-2.5">
      {/* Panel Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#0D607B]">
              Guideline Alternatives &amp; Clinical Remediation
            </h3>
            <Badge variant="outline" className="text-[10px] font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
              {options.length} {options.length === 1 ? "Option" : "Options"}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
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
            className="h-7 text-[11px] px-2.5 text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC]"
          >
            <Sparkles className={`w-3 h-3 mr-1 ${isLoadingMore ? "animate-spin text-[#169781]" : "text-[#169781]"}`} />
            <span>{isLoadingMore ? "Consulting Engine..." : "Explore More Alternatives"}</span>
          </Button>
        )}
      </div>

      {/* Active Clinical Override Banner (if retained with rationale) */}
      {clinicalOverride && (
        <div className="p-2.5 bg-amber-50/90 border border-amber-300 rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              Prescription Retained with Documented Clinical Rationale
            </span>
            <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-800 border-amber-300 font-semibold">
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
        <div className="p-2.5 bg-[#F1F8FC] border border-[#C9E9EB] rounded-lg flex items-start gap-2 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-[#169781] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#0D607B] block text-[11px]">Official First-Line Regimen (ICMR STG):</span>
            <span className="text-slate-700 font-medium text-[11px]">{firstLineRegimen}</span>
          </div>
        </div>
      )}

      {stewardshipGuidance && (
        <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed italic">
          &quot;{stewardshipGuidance}&quot;
        </p>
      )}

      {/* Remediation Options List */}
      <div className="space-y-2.5">
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

          // Prioritize matching flagged antimicrobial if available, or first antibiotic in regimen
          const originalMedicine = medicines.find(m => 
            matchingFlag?.drug && (
              m.genericName.toLowerCase().includes(matchingFlag.drug.toLowerCase()) ||
              m.brandName.toLowerCase().includes(matchingFlag.drug.toLowerCase())
            )
          ) || medicines.find(m => !isSupportiveMedicine(m)) || medicines[0];

          const badgeConfig = getDrugClassificationBadge(originalMedicine);
          const isSupportive = badgeConfig.isSupportive;

          return (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#169781]/40 shadow-2xs space-y-2 transition-all"
            >
              {/* Card Header: Type Badge + Guideline Reference */}
              <div className="flex items-center justify-between flex-wrap gap-1.5 pb-1.5 border-b border-slate-100">
                <Badge variant="outline" className={`gap-1 text-[10px] px-2 py-0.5 font-bold ${cfg.badgeClass}`}>
                  <Icon className="w-3 h-3" />
                  <span>{cfg.label}</span>
                </Badge>
                
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  <span>{opt.source_citation || "CDSCO Banned FDCs Gazette & ICMR Antimicrobial Stewardship"}</span>
                </div>
              </div>

              {/* SIDE-BY-SIDE REGIMEN COMPARISON (Original vs Proposed Alternative) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Left: Original Prescribed */}
                <div className={`p-3 rounded-lg border space-y-1.5 ${
                  isSupportive 
                    ? "bg-slate-50/80 border-slate-200" 
                    : "bg-rose-50/40 border-rose-200/70"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isSupportive ? "text-slate-700" : "text-rose-800"
                    }`}>
                      {isSupportive ? (
                        <Info className="w-3 h-3 text-slate-500" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                      )}
                      {isSupportive ? "Current Supportive Therapy" : "Original Prescription"}
                    </span>
                    <Badge variant="outline" className={`text-[9px] ${badgeConfig.className}`}>
                      {badgeConfig.label}
                    </Badge>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {originalMedicine ? `${originalMedicine.genericName || originalMedicine.brandName} ${originalMedicine.dose || ""}` : (matchingFlag?.drug || "Prescribed Molecule")}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Duration: <span className="font-semibold text-slate-800">{originalMedicine?.duration || "10-14 days"}</span>
                  </div>
                  {matchingFlag && (
                    <div className="text-[10px] text-rose-700 font-medium bg-rose-100/60 px-1.5 py-0.5 rounded border border-rose-200/50 truncate">
                      <strong>Flagged:</strong> {matchingFlag.rule_name}
                    </div>
                  )}
                </div>

                {/* Right: Proposed Guideline Alternative */}
                <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {isSupportive ? "Initiate Guideline Antibiotic" : "Proposed Alternative"}
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
                  <div className="text-[10px] text-emerald-700 font-medium bg-emerald-100/60 px-1.5 py-0.5 rounded border border-emerald-200/50 truncate">
                    <strong>Clinical Benefit:</strong> First-line ICMR recommendation; targeted efficacy
                  </div>
                </div>
              </div>

              {/* Compact Clinical Rationale */}
              <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/70 rounded-lg text-[11px] text-slate-700 leading-snug flex items-start gap-1.5">
                <span className="font-bold text-[#0D607B] shrink-0 text-[10px] uppercase tracking-wider mt-0.5">
                  Clinical Rationale:
                </span>
                <span className="text-slate-600 font-normal">{opt.guidance || matchingFlag?.rationale}</span>
              </div>

              {/* Doctor Actions Toolbar */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Select Action:
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Action 1: Retain with Documented Rationale */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRetainDialog(opt)}
                    className="h-7 text-[11px] px-2.5 gap-1 text-amber-800 border-amber-300 hover:bg-amber-50"
                    title="Keep prescribed medicine and document clinical justification"
                  >
                    <FileText className="w-3 h-3 text-amber-600" />
                    <span>Keep Current (Add Reason)</span>
                  </Button>

                  {/* Action 2: Modify Regimen */}
                  {onModify && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onModify(opt)}
                      className="h-7 text-[11px] px-2.5 gap-1 text-slate-700 hover:text-[#0D607B] hover:border-[#0D607B]/40"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Adjust Dose / Days</span>
                    </Button>
                  )}

                  {/* Action 3: Accept Recommendation (Primary CTA) */}
                  {onApply && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedOptionForSwitch({
                          option: opt,
                          originalMedicine,
                          matchingFlag,
                        });
                      }}
                      className="h-7 text-[11px] px-3 gap-1 bg-[#169781] hover:bg-[#117866] text-white font-semibold shadow-2xs"
                    >
                      <CheckCircle2 className="w-3 h-3" />
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

          {/* Circular Progress Indicator when processing */}
          {isRetaining && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 animate-pulse">
              <svg className="w-5 h-5 animate-spin text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Documenting clinical justification into hospital stewardship audit trail...</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRetaining}
              onClick={() => setIsRetainDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isRetaining}
              onClick={handleConfirmRetain}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold min-w-[170px] gap-1.5"
            >
              {isRetaining ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Rationale...</span>
                </>
              ) : (
                <span>Confirm &amp; Retain with Rationale</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Switch Medication Confirmation Dialog */}
      {selectedOptionForSwitch && (
        <SwitchMedicineDialog
          isOpen={Boolean(selectedOptionForSwitch)}
          onClose={() => setSelectedOptionForSwitch(null)}
          onConfirm={(confirmedDays) => {
            if (onApply) {
              onApply({
                ...selectedOptionForSwitch.option,
                suggested_duration_days: confirmedDays || selectedOptionForSwitch.option.suggested_duration_days,
              });
            }
            setSelectedOptionForSwitch(null);
          }}
          currentMedicine={{
            name: selectedOptionForSwitch.originalMedicine
              ? `${selectedOptionForSwitch.originalMedicine.genericName || selectedOptionForSwitch.originalMedicine.brandName} ${selectedOptionForSwitch.originalMedicine.dose || ""}`
              : (selectedOptionForSwitch.matchingFlag?.drug || "Prescribed Molecule"),
            dose: selectedOptionForSwitch.originalMedicine?.dose,
            duration: selectedOptionForSwitch.originalMedicine?.duration || "5 days",
            frequency: selectedOptionForSwitch.originalMedicine?.frequency || "BD",
            tier: selectedOptionForSwitch.originalMedicine?.aware_tier ? `${selectedOptionForSwitch.originalMedicine.aware_tier} Tier` : "Watch Tier",
            reasonFlagged: selectedOptionForSwitch.matchingFlag?.rationale || selectedOptionForSwitch.matchingFlag?.rule_name || "Safety alert: Irrational antimicrobial selection.",
          }}
          targetMedicine={{
            name: selectedOptionForSwitch.option.suggested_drug || (firstLineRegimen || "Rational single-agent narrow-spectrum alternative"),
            dose: "250mg",
            duration: `${selectedOptionForSwitch.option.suggested_duration_days || 5} days`,
            durationDays: selectedOptionForSwitch.option.suggested_duration_days || 5,
            frequency: "Twice daily (BD)",
            tier: "Access (Safe Choice)",
            clinicalBenefit: "First-line ICMR STG recommendation with lowest antimicrobial resistance risk.",
          }}
        />
      )}
    </div>
  );
}
