// [SOLID: SRP & OCP] Dedicated Manual Prescription Input Form with Structured Rx Builder & Clinical Notes
"use client";

import React, { useState, useEffect } from "react";
import { MedicineEntry, AwareTier } from "@/types/prescription";
import { 
  Pill, 
  Plus, 
  Trash2, 
  FileText, 
  Check, 
  X, 
  Sparkles, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ManualPrescriptionFormProps {
  draftText: string;
  onTextChange: (text: string) => void;
  onLoadSample: () => void;
  disabled?: boolean;
}

// Preset antimicrobial suggestions for 1-click clinical entry
const QUICK_SUGGESTIONS = [
  { brand: "Augmentin", generic: "Amoxicillin + Clavulanate", strength: "625 mg", dose: "1 tablet", route: "Oral", freq: "Twice daily (BD)", dur: "5 days", tier: "Access" },
  { brand: "Azithral", generic: "Azithromycin", strength: "500 mg", dose: "1 tablet", route: "Oral", freq: "Once daily (OD)", dur: "3 days", tier: "Watch" },
  { brand: "Taxim-O", generic: "Cefixime", strength: "200 mg", dose: "1 tablet", route: "Oral", freq: "Twice daily (BD)", dur: "5 days", tier: "Watch" },
  { brand: "Cifran", generic: "Ciprofloxacin", strength: "500 mg", dose: "1 tablet", route: "Oral", freq: "Twice daily (BD)", dur: "5 days", tier: "Watch" },
  { brand: "Dolo 650", generic: "Paracetamol", strength: "650 mg", dose: "1 tablet", route: "Oral", freq: "As needed (SOS)", dur: "3 days", tier: "Access" },
  { brand: "Zyvox", generic: "Linezolid", strength: "600 mg", dose: "1 tablet", route: "Oral", freq: "Twice daily (BD)", dur: "7 days", tier: "Reserve" },
];

export function ManualPrescriptionForm({
  draftText,
  onTextChange,
  onLoadSample,
  disabled = false,
}: ManualPrescriptionFormProps) {
  const [inputMode, setInputMode] = useState<"structured" | "freeform">("structured");

  // Structured Item Form State
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [strength, setStrength] = useState("");
  const [dose, setDose] = useState("1 tablet");
  const [route, setRoute] = useState("Oral");
  const [frequency, setFrequency] = useState("Twice daily (BD)");
  const [durationDays, setDurationDays] = useState(5);
  const [itemError, setItemError] = useState<string | null>(null);

  // List of structured items in the current draft
  const [medList, setMedList] = useState<MedicineEntry[]>([]);

  // Classify AWaRe tier on the fly
  const currentAwareTier: AwareTier = (() => {
    const combined = `${brandName} ${genericName}`.toLowerCase();
    if (combined.includes("linezolid") || combined.includes("colistin") || combined.includes("meropenem")) return "Reserve";
    if (
      combined.includes("azithromycin") || 
      combined.includes("cefixime") || 
      combined.includes("ciprofloxacin") || 
      combined.includes("levofloxacin") ||
      combined.includes("clarithromycin")
    ) return "Watch";
    if (combined.includes("amoxicillin") || combined.includes("paracetamol") || combined.includes("cetirizine")) return "Access";
    return "Access";
  })();

  // Keep medList synced with draftText if draftText gets populated from preset
  useEffect(() => {
    if (draftText && medList.length === 0) {
      // Parse simple line-based text or keep existing
    }
  }, [draftText, medList.length]);

  // Synchronize medList into draftText format for the intake engine
  const syncMedListToText = (items: MedicineEntry[]) => {
    if (items.length === 0) {
      onTextChange("");
      return;
    }
    const lines = items.map((m, idx) => 
      `${idx + 1}. Tab/Cap ${m.brandName}${m.genericName ? ` (${m.genericName})` : ""} ${m.strength || m.dose} - ${m.route} ${m.frequency} x ${m.duration}`
    );
    const textOutput = `Rx Prescription Orders:\n${lines.join("\n")}`;
    onTextChange(textOutput);
  };

  const handleAddMed = () => {
    setItemError(null);
    if (!brandName.trim() && !genericName.trim()) {
      setItemError("Please enter a brand name or active molecule.");
      return;
    }
    if (!dose.trim()) {
      setItemError("Please specify a dose (e.g. 1 tablet).");
      return;
    }

    const newMed: MedicineEntry = {
      id: `draft-med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brandName: brandName.trim() || genericName.trim(),
      genericName: genericName.trim() || brandName.trim(),
      strength: strength.trim() || "Standard",
      dose: dose.trim(),
      route: route.trim() || "Oral",
      frequency: frequency.trim(),
      duration: `${durationDays} days`,
      duration_days: durationDays,
      aware_tier: currentAwareTier,
      verificationStatus: "Verified",
    };

    const updated = [...medList, newMed];
    setMedList(updated);
    syncMedListToText(updated);

    // Reset single item fields
    setBrandName("");
    setGenericName("");
    setStrength("");
    setDose("1 tablet");
    setDurationDays(5);
  };

  const handleRemoveMed = (id: string) => {
    const updated = medList.filter((m) => m.id !== id);
    setMedList(updated);
    syncMedListToText(updated);
  };

  const handleApplyPreset = (item: typeof QUICK_SUGGESTIONS[0]) => {
    setBrandName(item.brand);
    setGenericName(item.generic);
    setStrength(item.strength);
    setDose(item.dose);
    setRoute(item.route);
    setFrequency(item.freq);
    setDurationDays(parseInt(item.dur, 10) || 5);
    setItemError(null);
  };

  return (
    <div className="space-y-4">
      {/* Mode Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start">
          <Button
            type="button"
            size="sm"
            variant={inputMode === "structured" ? "default" : "ghost"}
            onClick={() => setInputMode("structured")}
            className={`h-7 px-3 text-xs rounded-lg font-semibold transition-all ${
              inputMode === "structured"
                ? "bg-[#0D607B] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            <span>Structured Rx Builder</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={inputMode === "freeform" ? "default" : "ghost"}
            onClick={() => setInputMode("freeform")}
            className={`h-7 px-3 text-xs rounded-lg font-semibold transition-all ${
              inputMode === "freeform"
                ? "bg-[#0D607B] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            <span>Clinical Notes Paste</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            disabled={disabled}
            className="h-7 text-xs px-2.5 text-[#0D607B] bg-[#F1F8FC] border-[#C9E9EB] hover:bg-[#E2FAD9]/50 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#169781]" />
            <span>Load OPD Preset</span>
          </Button>
        </div>
      </div>

      {/* --- MODE 1: STRUCTURED RX BUILDER --- */}
      {inputMode === "structured" ? (
        <div className="space-y-5">
          {/* Quick Click Antimicrobial Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Quick Prescribe Antimicrobials & Supportive Agents:</span>
              <span className="text-[10px] text-slate-400">Click to autofill builder</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(item)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:border-[#169781] hover:bg-[#F1F8FC] text-slate-700 font-medium transition-all flex items-center gap-1.5 shadow-2xs group"
                >
                  <Pill className="w-3 h-3 text-[#169781] group-hover:scale-110 transition-transform" />
                  <span>{item.brand} ({item.strength})</span>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 ${
                    item.tier === "Access" 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                      : item.tier === "Watch" 
                      ? "text-amber-700 bg-amber-50 border-amber-200" 
                      : "text-rose-700 bg-rose-50 border-rose-200"
                  }`}>
                    {item.tier}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Builder Input Strip */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50/80 to-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#E2FAD9] flex items-center justify-center text-[#169781]">
                  <Pill className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#0D607B] uppercase tracking-wide">
                  Add Prescribed Item
                </span>
              </div>

              {/* Dynamic AWaRe Tier Badge */}
              <Badge variant="outline" className={`text-[10px] font-semibold gap-1 ${
                currentAwareTier === "Access"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : currentAwareTier === "Watch"
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-rose-50 text-rose-800 border-rose-300"
              }`}>
                <span>WHO Tier: {currentAwareTier}</span>
              </Badge>
            </div>

            {itemError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{itemError}</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={brandName}
                  onChange={(e) => {
                    setBrandName(e.target.value);
                    setItemError(null);
                  }}
                  placeholder="e.g. Augmentin, Cifran"
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Active Molecule / Generic
                </label>
                <Input
                  type="text"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Amoxicillin-Clav"
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Strength
                </label>
                <Input
                  type="text"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  placeholder="e.g. 625 mg, 500 mg"
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Dose <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="e.g. 1 tablet, 5 mL"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Route
                </label>
                <Select value={route} onValueChange={(val: string | null) => val && setRoute(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oral">Oral (PO)</SelectItem>
                    <SelectItem value="Intravenous">Intravenous (IV)</SelectItem>
                    <SelectItem value="Intramuscular">Intramuscular (IM)</SelectItem>
                    <SelectItem value="Inhalation">Inhalation</SelectItem>
                    <SelectItem value="Topical">Topical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Frequency
                </label>
                <Select value={frequency} onValueChange={(val: string | null) => val && setFrequency(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily (OD)">Once daily (OD)</SelectItem>
                    <SelectItem value="Twice daily (BD)">Twice daily (BD)</SelectItem>
                    <SelectItem value="Three times daily (TID)">Three times daily (TID)</SelectItem>
                    <SelectItem value="Four times daily (QID)">Four times daily (QID)</SelectItem>
                    <SelectItem value="As needed (SOS)">As needed (SOS)</SelectItem>
                    <SelectItem value="At bedtime (HS)">At bedtime (HS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Duration: <span className="font-bold text-[#0D607B]">{durationDays} Days</span>
                  </label>
                  <div className="flex gap-1 text-[10px]">
                    {[3, 5, 7, 10].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`px-1 rounded ${durationDays === d ? "bg-[#0D607B] text-white font-bold" : "bg-slate-200 text-slate-600"}`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div>
                <Button
                  type="button"
                  onClick={handleAddMed}
                  className="w-full h-8 text-xs font-semibold bg-[#169781] hover:bg-[#117866] text-white shadow-2xs gap-1.5 transition-all hover:scale-[1.01]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add to Prescription</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Current Prescribed Medication Cards List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Prescription Regimen Items:</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-200 text-slate-700">
                  {medList.length}
                </Badge>
              </span>
              {medList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMedList([]);
                    syncMedListToText([]);
                  }}
                  className="text-[11px] text-slate-400 hover:text-red-600 font-medium transition-colors"
                >
                  Clear all items
                </button>
              )}
            </div>

            {medList.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1.5">
                <Pill className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-500">
                  No medication items added to prescription yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Use the quick suggestion chips above or enter brand name and click &quot;Add to Prescription&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 animate-in fade-in duration-200">
                {medList.map((med, index) => (
                  <div
                    key={med.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#169781]/40 shadow-2xs flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F1F8FC] border border-[#C9E9EB] text-[#0D607B] font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {med.brandName}
                          </h4>
                          {med.genericName && (
                            <span className="text-[11px] text-slate-400 font-medium truncate">
                              ({med.genericName})
                            </span>
                          )}
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                            med.aware_tier === "Access"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : med.aware_tier === "Watch"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-rose-50 text-rose-700 border-rose-300"
                          }`}>
                            {med.aware_tier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{med.strength || med.dose}</span>
                          <span>•</span>
                          <span>{med.route}</span>
                          <span>•</span>
                          <span>{med.frequency}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{med.duration}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMed(med.id)}
                      className="h-7 w-7 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- MODE 2: FREEFORM CLINICAL NOTES PASTE --- */
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Prescription Notes & Clinical Consultation Orders</span>
              <span className="text-red-500">*</span>
            </label>
            {draftText.length > 0 && (
              <button
                type="button"
                onClick={() => onTextChange("")}
                className="text-[11px] text-slate-400 hover:text-red-600"
              >
                Clear notes
              </button>
            )}
          </div>

          <Textarea
            rows={8}
            value={draftText}
            onChange={(e) => onTextChange(e.target.value)}
            disabled={disabled}
            placeholder="Type or paste clinic consultation orders... e.g.:
1. Tab. Taxim-O (Cefixime) 200 mg PO BD x 5 days
2. Tab. Azithral (Azithromycin) 500 mg PO OD x 3 days
3. Tab. Dolo (Paracetamol) 650 mg PO SOS x 3 days..."
            className="w-full text-xs font-mono leading-relaxed bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#169781]"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-slate-400" />
              <span>Extracted automatically by AMR Sentinel extraction model</span>
            </span>
            <span className="font-mono">{draftText.length} characters</span>
          </div>
        </div>
      )}
    </div>
  );
}
