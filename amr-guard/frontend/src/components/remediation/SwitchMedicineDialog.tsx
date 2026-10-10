// [SOLID: SRP & Open-Closed] Dedicated Clinical Confirmation Dialog for Switching Medication
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Clock,
  User,
  Info,
  Loader2
} from "lucide-react";

export interface SwitchMedicineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedDurationDays?: number) => void | Promise<void>;
  isProcessing?: boolean;
  caseId?: string;
  patientName?: string;
  patientAge?: number | string;
  patientSex?: string;
  diagnosis?: string;
  currentMedicine: {
    name: string;
    dose?: string;
    duration?: string;
    frequency?: string;
    tier?: string;
    reasonFlagged?: string;
  };
  targetMedicine: {
    name: string;
    dose?: string;
    duration?: string;
    durationDays?: number;
    frequency?: string;
    tier?: string;
    clinicalBenefit?: string;
    guidelineSource?: string;
  };
}

export function SwitchMedicineDialog({
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
  caseId,
  patientName,
  patientAge,
  patientSex,
  diagnosis,
  currentMedicine,
  targetMedicine,
}: SwitchMedicineDialogProps) {
  const [confirmedDays, setConfirmedDays] = useState<number>(
    targetMedicine.durationDays || 5
  );
  const [isInternalBusy, setIsInternalBusy] = useState(false);
  const effectiveLoading = isProcessing || isInternalBusy;

  useEffect(() => {
    if (targetMedicine.durationDays) {
      setConfirmedDays(targetMedicine.durationDays);
    }
  }, [targetMedicine.durationDays]);

  const handleConfirm = async () => {
    try {
      setIsInternalBusy(true);
      await onConfirm(confirmedDays);
      onClose();
    } catch (err) {
      console.error("Failed to execute medication switch:", err);
    } finally {
      setIsInternalBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#169781]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Confirm Medication Switch &amp; Clinical Remediation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Verify regimen changes against ICMR antimicrobial stewardship protocol before executing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Patient Clinical Context Strip */}
        <div className="bg-[#F1F8FC] border border-[#C9E9EB] rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#0D607B]" />
            <span className="font-bold text-[#0D607B]">
              {patientName || "Outpatient"}
            </span>
            <span className="text-slate-500">
              • {patientAge ? `${patientAge}y` : "Age N/A"} {patientSex ? `(${patientSex})` : ""}
            </span>
            {caseId && (
              <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#C9E9EB] text-slate-600 font-semibold">
                {caseId}
              </span>
            )}
          </div>
          {diagnosis && (
            <div className="text-[11px] text-slate-700">
              Diagnosis: <strong className="text-slate-900">{diagnosis}</strong>
            </div>
          )}
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* LEFT: Current Prescribed (Stopping) */}
          <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/60">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Stopping Current Regimen
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-rose-100 text-rose-800 border-rose-200 font-semibold">
                  {currentMedicine.tier || "Watch Tier"}
                </Badge>
              </div>

              <div className="mt-2 space-y-1">
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {currentMedicine.name}
                </div>
                {currentMedicine.dose && (
                  <div className="text-xs text-slate-600">
                    Strength: <span className="font-medium text-slate-800">{currentMedicine.dose}</span>
                  </div>
                )}
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Prescribed Course: <strong>{currentMedicine.duration || "5 days"}</strong></span>
                  {currentMedicine.frequency && <span>• {currentMedicine.frequency}</span>}
                </div>
              </div>
            </div>

            {/* Why Stopping Callout */}
            <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-[11px] text-rose-900 leading-snug">
              <strong className="block text-[10px] uppercase font-bold text-rose-800 mb-0.5">
                Stewardship Alert:
              </strong>
              {currentMedicine.reasonFlagged || "Safety alert: Irrational antimicrobial selection accelerates resistance."}
            </div>
          </div>

          {/* RIGHT: Recommended Alternative (Starting) */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Prescribing First-Line Choice
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
                  {targetMedicine.tier || "Access (Safe Choice)"}
                </Badge>
              </div>

              <div className="mt-2 space-y-1">
                <div className="text-sm font-bold text-emerald-950 leading-snug">
                  {targetMedicine.name}
                </div>
                {targetMedicine.dose && (
                  <div className="text-xs text-emerald-800">
                    Recommended Strength: <span className="font-medium text-slate-800">{targetMedicine.dose}</span>
                  </div>
                )}
                <div className="text-xs text-emerald-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Target Course: <strong>{confirmedDays} days</strong></span>
                  {targetMedicine.frequency && <span>• {targetMedicine.frequency}</span>}
                </div>
              </div>
            </div>

            {/* Benefit Callout */}
            <div className="p-2 rounded-lg bg-emerald-100/70 border border-emerald-200 text-[11px] text-emerald-900 leading-snug">
              <strong className="block text-[10px] uppercase font-bold text-emerald-800 mb-0.5">
                Clinical Benefit:
              </strong>
              {targetMedicine.clinicalBenefit || "First-line ICMR STG recommendation; targeted antimicrobial efficacy with lowest resistance pressure."}
            </div>
          </div>
        </div>

        {/* Course Duration Confirmation / Adjustment */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0D607B] shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Confirm Treatment Duration (Days):</span>
              <span className="text-[11px] text-slate-500">ICMR standard course for acute condition is 3 to 5 days.</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="number"
              min={1}
              max={21}
              value={confirmedDays}
              onChange={(e) => setConfirmedDays(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 h-8 text-center text-xs font-bold bg-white"
            />
            <span className="text-xs font-semibold text-slate-600">days</span>
          </div>
        </div>

        {/* Safety Outcome Notice */}
        <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Executing this switch will remove the antimicrobial safety block and certify the prescription as <strong>Safe &amp; Approved (Access Tier)</strong>.
          </span>
        </div>

        {/* Circular Progress Indicator when processing */}
        {effectiveLoading && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-emerald-900 shadow-xs animate-pulse">
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 animate-spin text-[#169781]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">
                Executing Regimen Switch &amp; Safety Re-Audit...
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                Updating patient records, evaluating ICMR STG compliance rules, and re-calculating antimicrobial risk score.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={effectiveLoading}
            onClick={onClose}
            className="text-xs"
          >
            Cancel (Keep Current)
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={effectiveLoading}
            onClick={handleConfirm}
            className="text-xs bg-[#169781] hover:bg-[#117866] text-white font-semibold gap-1.5 shadow-xs min-w-[160px]"
          >
            {effectiveLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Switching Regimen...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm &amp; Switch Regimen</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
