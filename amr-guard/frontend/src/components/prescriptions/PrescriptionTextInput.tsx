"use client";

import { useState, useMemo, ChangeEvent } from "react";
import { Trash2, FileText, AlertCircle, Check, X, Sparkles } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { parseClinicalText } from "@/lib/clinicalTextParser";

interface PrescriptionTextInputProps {
  value?: string;
  onChange: (value: string) => void;
  onLoadSample: () => void;
  disabled?: boolean;
}

const MAX_CHAR_COUNT = 5000;

export function PrescriptionTextInput({
  value = "",
  onChange,
  onLoadSample,
  disabled = false,
}: PrescriptionTextInputProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const safeValue = value || "";

  // [SOLID: SRP] Parse clinical entities in real time to show live sync feedback
  const detected = useMemo(() => parseClinicalText(safeValue), [safeValue]);

  const detectedItems = useMemo(() => {
    const items: string[] = [];
    if (detected.patientName) {
      items.push(`Patient: ${detected.patientName}`);
    }
    if (detected.age !== undefined && detected.age !== "") {
      items.push(`Age: ${detected.age} yrs`);
    }
    if (detected.sex) {
      items.push(`Sex: ${detected.sex}`);
    }
    if (detected.weight_kg !== undefined && detected.weight_kg !== "") {
      items.push(`Weight: ${detected.weight_kg} kg`);
    }
    if (detected.egfr !== undefined && detected.egfr !== "") {
      items.push(`eGFR: ${detected.egfr} mL/min`);
    }
    if (detected.suspectedDiagnosis) {
      const diag = detected.suspectedDiagnosis;
      items.push(`Diagnosis: ${diag.length > 30 ? diag.slice(0, 30) + "..." : diag}`);
    }
    return items;
  }, [detected]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const confirmClear = () => {
    onChange("");
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-2">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between pb-1">
        <label
          htmlFor="prescription-text-input"
          className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
        >
          <span>Prescription Notes & Clinical Orders</span>
          <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            disabled={disabled}
            className="gap-1.5 text-xs h-7 px-2.5 text-[#0D607B] hover:text-[#169781] bg-[#F1F8FC] border-[#C9E9EB] hover:bg-[#E2FAD9]/50"
            title="Load realistic sample clinical prescription"
          >
            <FileText className="w-3.5 h-3.5 text-[#169781]" />
            <span>Fill Sample OPD Text</span>
          </Button>

          {safeValue.length > 0 && !showClearConfirm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              disabled={disabled}
              className="gap-1 text-xs h-7 px-2 text-slate-400 hover:text-red-600"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Button>
          )}

          {showClearConfirm && (
            <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px] text-red-700 animate-in fade-in duration-100">
              <span>Clear text?</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={confirmClear}
                className="w-5 h-5 p-0 hover:bg-red-100 text-red-800 font-semibold"
                title="Confirm clear"
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowClearConfirm(false)}
                className="w-5 h-5 p-0 hover:bg-red-100 text-slate-500"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Multiline Input Area */}
      <div className="relative">
        <Textarea
          id="prescription-text-input"
          rows={8}
          value={safeValue}
          onChange={handleChange}
          disabled={disabled}
          maxLength={MAX_CHAR_COUNT}
          placeholder="Example: Patient presents with fever and cough for 3 days. Prescribed: Cefixime 200 mg 1 tab BD x 5 days, Paracetamol 650 mg SOS, Cetirizine 10 mg HS..."
          className="w-full text-sm placeholder:text-slate-400 font-mono text-[13px] leading-relaxed resize-y focus-visible:ring-1 focus-visible:ring-[#169781]"
        />
      </div>

      {/* Dynamic Sync Live Feedback Chips */}
      {detectedItems.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 bg-[#F1F8FC] rounded-xl border border-[#C9E9EB] text-[11px] text-[#0D607B]">
          <div className="flex items-center gap-1 font-semibold text-[#169781] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-synced to patient fields:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {detectedItems.map((item, idx) => (
              <span
                key={idx}
                className="bg-white px-2 py-0.5 rounded-md border border-[#C9E9EB] text-slate-700 font-medium shadow-2xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info & Character Count */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-slate-400" />
          <span>Do not invent missing dosages or durations; enter exactly as prescribed.</span>
        </div>
        <span className={safeValue.length > MAX_CHAR_COUNT * 0.9 ? "text-amber-600 font-semibold" : ""}>
          {safeValue.length} / {MAX_CHAR_COUNT} characters
        </span>
      </div>
    </div>
  );
}
