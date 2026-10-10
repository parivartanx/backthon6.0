// [SOLID: SRP & UI/UX Pro Max] Clean, Compact Clinical Right Sheet Drawer for Prescribed Medications
"use client";

import React, { useState, useEffect, useRef } from "react";
import { MedicineEntry, AwareTier } from "@/types/prescription";
import { 
  Pill, 
  X, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (medicine: MedicineEntry) => void;
}

function detectAwareTier(name: string): AwareTier {
  const norm = name.toLowerCase();
  const reserve = ["colistin", "linezolid", "tigecycline", "meropenem", "imipenem", "polymyxin"];
  const watch = ["cipro", "levo", "oflox", "norflox", "azithro", "cefix", "ceftriax", "cefotax", "clarithro"];
  if (reserve.some((r) => norm.includes(r))) return "Reserve";
  if (watch.some((w) => norm.includes(w))) return "Watch";
  return "Access";
}

function parseDays(durationStr: string): number {
  const lower = durationStr.toLowerCase();
  const match = lower.match(/(\d+)/);
  if (!match) return 5;
  const num = parseInt(match[1], 10);
  if (lower.includes("week") || lower.includes("wk")) return num * 7;
  return num;
}

export function AddMedicineModal({ isOpen, onClose, onAdd }: AddMedicineModalProps) {
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [strength, setStrength] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("Oral");
  const [frequency, setFrequency] = useState("Twice daily (BD)");
  const [duration, setDuration] = useState("5 days");
  const [error, setError] = useState<string | null>(null);
  const [lastAddedNotice, setLastAddedNotice] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const brandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        brandInputRef.current?.focus();
      }, 100);
      setLastAddedNotice(null);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setBrandName("");
    setGenericName("");
    setStrength("");
    setDose("");
    setRoute("Oral");
    setFrequency("Twice daily (BD)");
    setDuration("5 days");
    setError(null);
  };

  const buildMedicine = (): MedicineEntry | null => {
    if (!brandName.trim() && !genericName.trim()) {
      setError("Please enter a Medicine Brand or Generic Name.");
      return null;
    }
    if (!dose.trim()) {
      setError("Dose is required (e.g. 1 tablet, 500 mg).");
      return null;
    }

    const effective = genericName.trim() || brandName.trim();
    const tier = detectAwareTier(effective);
    const days = parseDays(duration);

    return {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brandName: brandName.trim() || genericName.trim(),
      genericName: genericName.trim() || brandName.trim(),
      strength: strength.trim() || "Standard",
      dose: dose.trim(),
      route: route.trim() || "Oral",
      frequency: frequency.trim(),
      duration: duration.trim() || "5 days",
      duration_days: days,
      aware_tier: tier,
      verificationStatus: "Verified",
    };
  };

  const handleSaveAndClose = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const med = buildMedicine();
    if (!med) return;
    try {
      setIsAdding(true);
      await Promise.resolve(onAdd(med));
      resetForm();
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddAndMore = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const med = buildMedicine();
    if (!med) return;
    try {
      setIsAdding(true);
      await Promise.resolve(onAdd(med));
      const addedName = med.brandName || med.genericName;
      setLastAddedNotice(`Added "${addedName}". Ready for next medicine.`);
      resetForm();
      setTimeout(() => {
        brandInputRef.current?.focus();
      }, 50);
    } finally {
      setIsAdding(false);
    }
  };

  const currentTier = (genericName || brandName) ? detectAwareTier(genericName || brandName) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-2xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Slide-Over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <aside 
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-250 ease-out"
          role="dialog"
          aria-modal="true"
        >
          {/* Compact Header */}
          <header className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E2FAD9] flex items-center justify-center text-[#0d5c36]">
                <Pill className="w-4 h-4 text-[#169781]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0D607B]">Add Medication</h2>
                <p className="text-[11px] text-slate-500">Prescription order entry</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
            {lastAddedNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-150">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {lastAddedNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setLastAddedNotice(null)}
                  className="text-emerald-700 font-semibold text-[10px] ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="py-2 px-3 text-xs rounded-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 p-0.5 rounded transition-colors shrink-0"
                  aria-label="Dismiss error"
                  title="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Alert>
            )}

            <form onSubmit={handleSaveAndClose} className="space-y-3">
              {/* Row 1: Brand & Generic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={brandInputRef}
                    type="text"
                    value={brandName}
                    onChange={(e) => {
                      setBrandName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Augmentin, Cifran"
                    className="h-8.5 text-xs bg-white border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Generic Active Molecule
                  </label>
                  <Input
                    type="text"
                    value={genericName}
                    onChange={(e) => {
                      setGenericName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Amoxicillin, Ciprofloxacin"
                    className="h-8.5 text-xs bg-white border-slate-300"
                  />
                </div>
              </div>

              {/* Compact Tier Indicator */}
              {currentTier && (
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                  <span className="text-[11px] text-slate-500">WHO AWaRe Classification:</span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] font-semibold px-2 py-0.5 ${
                      currentTier === "Access" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : currentTier === "Watch"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-rose-50 text-rose-800 border-rose-300"
                    }`}
                  >
                    {currentTier} Tier
                  </Badge>
                </div>
              )}

              {/* Row 2: Strength & Dose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Strength
                  </label>
                  <Input
                    type="text"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500 mg, 625 mg"
                    className="h-8.5 text-xs bg-white border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dose <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={dose}
                    onChange={(e) => {
                      setDose(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. 1 tablet, 1 cap, 5 mL"
                    className="h-8.5 text-xs bg-white border-slate-300"
                  />
                </div>
              </div>

              {/* Row 3: Route & Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Route
                  </label>
                  <Select value={route} onValueChange={(v) => v && setRoute(v)}>
                    <SelectTrigger className="h-8.5 text-xs bg-white border-slate-300">
                      <SelectValue placeholder="Route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oral">Oral (PO)</SelectItem>
                      <SelectItem value="Intravenous">Intravenous (IV)</SelectItem>
                      <SelectItem value="Intramuscular">Intramuscular (IM)</SelectItem>
                      <SelectItem value="Inhalation">Inhalation</SelectItem>
                      <SelectItem value="Topical">Topical</SelectItem>
                      <SelectItem value="Sublingual">Sublingual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency
                  </label>
                  <Select value={frequency} onValueChange={(v) => v && setFrequency(v)}>
                    <SelectTrigger className="h-8.5 text-xs bg-white border-slate-300">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily (OD)">Once daily (OD)</SelectItem>
                      <SelectItem value="Twice daily (BD)">Twice daily (BD)</SelectItem>
                      <SelectItem value="Three times daily (TID)">Three times daily (TID)</SelectItem>
                      <SelectItem value="Four times daily (QID)">Four times daily (QID)</SelectItem>
                      <SelectItem value="Once weekly (QW)">Once weekly (QW)</SelectItem>
                      <SelectItem value="Twice weekly (BIW)">Twice weekly (BIW)</SelectItem>
                      <SelectItem value="As needed (SOS)">As needed (SOS)</SelectItem>
                      <SelectItem value="At bedtime (HS)">At bedtime (HS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Duration with Compact Quick Chips */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Standard: 3–7 days</span>
                </div>
                <Input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 5 days, 1 week, 2 weeks"
                  className="h-8.5 text-xs bg-white border-slate-300"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">Quick:</span>
                  {[
                    { label: "3 days", val: "3 days" },
                    { label: "5 days", val: "5 days" },
                    { label: "7 days", val: "7 days" },
                    { label: "1 week", val: "1 week (7 days)" },
                    { label: "2 weeks", val: "2 weeks (14 days)" },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setDuration(chip.val)}
                      className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                        duration === chip.val
                          ? "bg-[#169781] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Compact Footer */}
          <footer className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAdding}
              onClick={onClose}
              className="text-xs h-8 px-3 border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isAdding}
                onClick={handleAddAndMore}
                className="text-xs h-8 px-3 font-semibold bg-slate-200/80 hover:bg-slate-300 text-slate-800 gap-1"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add &amp; Add More</span>
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isAdding}
                onClick={() => handleSaveAndClose()}
                className="text-xs h-8 px-3.5 font-semibold bg-[#169781] hover:bg-[#117866] text-white min-w-[100px] gap-1.5"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Medicine</span>
                )}
              </Button>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
}
