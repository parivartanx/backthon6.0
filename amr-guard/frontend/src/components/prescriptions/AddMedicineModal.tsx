// [SOLID: SRP & UI/UX Pro Max] Professional Clinical Right Sheet Drawer for Prescribed Medications
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { MedicineEntry, AwareTier } from "@/types/prescription";
import { 
  Pill, 
  X, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  Sparkles,
  ArrowRight
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

// Quick common clinical presets for fast 1-click intake
const COMMON_ANTIBIOTIC_PRESETS = [
  { brand: "Augmentin", generic: "Amoxicillin + Clavulanate", strength: "625 mg", dose: "1 tablet", route: "Oral", frequency: "Twice daily (BD)", duration: "5 days" },
  { brand: "Amoxil", generic: "Amoxicillin", strength: "500 mg", dose: "1 capsule", route: "Oral", frequency: "Three times daily (TID)", duration: "5 days" },
  { brand: "Cifran", generic: "Ciprofloxacin", strength: "500 mg", dose: "1 tablet", route: "Oral", frequency: "Twice daily (BD)", duration: "7 days" },
  { brand: "Azithral", generic: "Azithromycin", strength: "500 mg", dose: "1 tablet", route: "Oral", frequency: "Once daily (OD)", duration: "3 days" },
  { brand: "Martifur", generic: "Nitrofurantoin", strength: "100 mg", dose: "1 capsule", route: "Oral", frequency: "Twice daily (BD)", duration: "5 days" },
  { brand: "Taxim-O", generic: "Cefixime", strength: "200 mg", dose: "1 tablet", route: "Oral", frequency: "Twice daily (BD)", duration: "5 days" },
];

function detectAwareTier(name: string): AwareTier {
  const norm = name.toLowerCase();
  const reserve = ["colistin", "linezolid", "tigecycline", "meropenem", "imipenem", "polymyxin"];
  const watch = ["cipro", "levo", "oflox", "norflox", "azithro", "cefix", "ceftriax", "cefotax", "clarithro"];
  if (reserve.some((r) => norm.includes(r))) return "Reserve";
  if (watch.some((w) => norm.includes(w))) return "Watch";
  return "Access";
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function addDaysToDate(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function AddMedicineModal({ isOpen, onClose, onAdd }: AddMedicineModalProps) {
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [strength, setStrength] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("Oral");
  const [frequency, setFrequency] = useState("Twice daily (BD)");
  const [duration, setDuration] = useState("5 days");
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks">("days");
  const [startDate, setStartDate] = useState(getTodayString());
  const [weekdaySchedule, setWeekdaySchedule] = useState("Monday");
  const [error, setError] = useState<string | null>(null);
  const [lastAddedNotice, setLastAddedNotice] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);

  const brandInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        brandInputRef.current?.focus();
      }, 150);
      setLastAddedNotice(null);
      setError(null);
      setStartDate(getTodayString());
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
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

  // Calculate parsed days for schedule display
  const parsedDays = useMemo(() => {
    const match = duration.match(/(\d+)/);
    if (!match) return 7;
    const num = parseInt(match[1], 10);
    const lower = duration.toLowerCase();
    if (lower.includes("week") || lower.includes("wk")) {
      return num * 7;
    }
    return num;
  }, [duration]);

  // Calculated End Date
  const calculatedEndDate = useMemo(() => {
    return addDaysToDate(startDate, parsedDays);
  }, [startDate, parsedDays]);

  if (!isOpen) return null;

  const resetForm = () => {
    setBrandName("");
    setGenericName("");
    setStrength("");
    setDose("");
    setRoute("Oral");
    setFrequency("Twice daily (BD)");
    setDuration("5 days");
    setDurationUnit("days");
    setError(null);
  };

  const handleApplyPreset = (p: typeof COMMON_ANTIBIOTIC_PRESETS[0]) => {
    setBrandName(p.brand);
    setGenericName(p.generic);
    setStrength(p.strength);
    setDose(p.dose);
    setRoute(p.route);
    setFrequency(p.frequency);
    setDuration(p.duration);
    setDurationUnit("days");
    setError(null);
  };

  // Quick weekly duration picker
  const handleSelectWeeklyDuration = (weeks: number) => {
    setDurationUnit("weeks");
    const days = weeks * 7;
    setDuration(`${weeks} ${weeks === 1 ? "week" : "weeks"} (${days} days)`);
  };

  const handleSelectDaysDuration = (days: number) => {
    setDurationUnit("days");
    setDuration(`${days} days`);
  };

  const buildMedicineObject = (): MedicineEntry | null => {
    if (!brandName.trim() && !genericName.trim()) {
      setError("Please provide either a Medicine Brand Name or Generic Molecule.");
      return null;
    }
    if (!dose.trim()) {
      setError("Dose is required (e.g. 1 tablet, 500 mg, 5 mL).");
      return null;
    }

    const effectiveDrug = genericName.trim() || brandName.trim();
    const awareTier = detectAwareTier(effectiveDrug);

    // If a weekly frequency with specific weekday is chosen, append day
    let finalFrequency = frequency;
    if (frequency.includes("weekly") && !frequency.includes("Every") && weekdaySchedule) {
      finalFrequency = `${frequency} (Every ${weekdaySchedule})`;
    }

    return {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      brandName: brandName.trim() || genericName.trim(),
      genericName: genericName.trim() || brandName.trim(),
      strength: strength.trim() || "Standard",
      dose: dose.trim(),
      route: route.trim() || "Oral",
      frequency: finalFrequency,
      duration: duration.trim() || "5 days",
      duration_days: parsedDays,
      aware_tier: awareTier,
      verificationStatus: duration.trim() ? "Verified" : "Needs Verification",
    };
  };

  // Submit and Close
  const handleSaveAndClose = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const med = buildMedicineObject();
    if (!med) return;

    onAdd(med);
    resetForm();
    onClose();
  };

  // Submit and Keep Open for Next Medicine
  const handleAddAndMore = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const med = buildMedicineObject();
    if (!med) return;

    onAdd(med);
    const savedName = med.brandName || med.genericName;
    setAddedCount((prev) => prev + 1);
    setLastAddedNotice(`Added "${savedName}" to prescription list. Ready to add next medication.`);
    resetForm();

    setTimeout(() => {
      brandInputRef.current?.focus();
    }, 50);
  };

  const activeDrugName = genericName || brandName;
  const currentAware = activeDrugName ? detectAwareTier(activeDrugName) : null;
  const isWeeklyFrequency = frequency.toLowerCase().includes("week");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay with blur */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Slide-over Sheet Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside 
          className="w-screen max-w-md md:max-w-lg lg:max-w-xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200/90 animate-in slide-in-from-right duration-300 ease-out"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slideover-title"
        >
          {/* Header */}
          <header className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50/80 border-b border-slate-200/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E2FAD9] border border-[#169781]/20 flex items-center justify-center text-[#0d5c36] shadow-2xs">
                <Pill className="w-5 h-5 text-[#169781]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="slideover-title" className="text-base font-bold text-[#0D607B]">
                    Add Prescribed Medication
                  </h2>
                  {addedCount > 0 && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
                      +{addedCount} added
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Clinical order entry with calendar scheduling & AWaRe audit
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5">
            {/* Success Alert Banner after "Add & Add More" */}
            {lastAddedNotice && (
              <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{lastAddedNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLastAddedNotice(null)}
                  className="text-emerald-600 hover:text-emerald-900 text-[11px] font-semibold shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="py-2.5 px-3 text-xs rounded-xl shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <AlertDescription className="font-medium ml-1.5">{error}</AlertDescription>
              </Alert>
            )}

            {/* Quick Common Presets Bar */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#169781]" />
                  <span>Quick Clinical Antibiotic Presets</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">1-click autofill</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_ANTIBIOTIC_PRESETS.map((p) => (
                  <button
                    key={p.brand}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#169781] hover:text-[#0D607B] hover:bg-[#F1F8FC] transition-colors shadow-2xs"
                  >
                    {p.brand} ({p.strength})
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveAndClose} className="space-y-4">
              {/* Row 1: Brand & Generic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
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
                    placeholder="e.g. Amoxicillin + Clavulanate"
                    className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
                  />
                </div>
              </div>

              {/* AWaRe Tier Live Badge Preview */}
              {currentAware && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Stewardship Tier:</span>
                  {currentAware === "Access" && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>WHO Access Tier (Preferred First-Line)</span>
                    </Badge>
                  )}
                  {currentAware === "Watch" && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>WHO Watch Tier (High Resistance Potential)</span>
                    </Badge>
                  )}
                  {currentAware === "Reserve" && (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-rose-50 text-rose-800 border-rose-300 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>WHO Reserve Tier (Air-gap / ICU Only)</span>
                    </Badge>
                  )}
                </div>
              )}

              {/* Row 2: Strength & Dose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Strength
                  </label>
                  <Input
                    type="text"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 625 mg, 500 mg, 100 mg"
                    className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
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
                    placeholder="e.g. 1 tablet, 1 capsule, 5 mL"
                    className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#169781]"
                  />
                </div>
              </div>

              {/* Row 3: Route, Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Administration Route
                  </label>
                  <Select value={route} onValueChange={(val: string | null) => val && setRoute(val)}>
                    <SelectTrigger className="h-9 text-xs bg-white border-slate-300">
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
                    Dosing Frequency
                  </label>
                  <Select value={frequency} onValueChange={(val: string | null) => val && setFrequency(val)}>
                    <SelectTrigger className="h-9 text-xs bg-white border-slate-300">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Daily Frequencies */}
                      <SelectItem value="Once daily (OD)">Once daily (OD)</SelectItem>
                      <SelectItem value="Twice daily (BD)">Twice daily (BD)</SelectItem>
                      <SelectItem value="Three times daily (TID)">Three times daily (TID)</SelectItem>
                      <SelectItem value="Four times daily (QID)">Four times daily (QID)</SelectItem>
                      
                      {/* Weekly & Periodic Frequencies */}
                      <SelectItem value="Once weekly (QW)">Once weekly (QW)</SelectItem>
                      <SelectItem value="Twice weekly (BIW)">Twice weekly (BIW)</SelectItem>
                      <SelectItem value="Three times weekly (TIW)">Three times weekly (TIW)</SelectItem>
                      <SelectItem value="Once every 2 weeks (Q2W)">Once every 2 weeks (Q2W)</SelectItem>

                      {/* PRN & Emergency */}
                      <SelectItem value="As needed (SOS)">As needed (SOS)</SelectItem>
                      <SelectItem value="At bedtime (HS)">At bedtime (HS)</SelectItem>
                      <SelectItem value="Stat (Immediate)">Stat (Immediate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional Day-of-Week Selector when Weekly Frequency is Chosen */}
              {isWeeklyFrequency && (
                <div className="p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-sky-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>Weekly Administration Day:</span>
                    </span>
                    <span className="text-[11px] font-medium text-sky-700">Every {weekdaySchedule}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setWeekdaySchedule(day)}
                        className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                          weekdaySchedule === day
                            ? "bg-sky-600 text-white shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-sky-100/50"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SCHEDULE & WEEKLY DATE SECTION */}
              <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-[#169781]" />
                    <span>Course Schedule & Weekly Dates</span>
                  </div>
                  {/* Mode switcher: Days vs Weeks */}
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setDurationUnit("days")}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        durationUnit === "days"
                          ? "bg-[#169781] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationUnit("weeks")}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        durationUnit === "weeks"
                          ? "bg-[#169781] text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Weeks
                    </button>
                  </div>
                </div>

                {/* Date Range Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8.5 text-xs bg-white border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Duration String <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 5 days, 2 weeks"
                      className="h-8.5 text-xs bg-white border-slate-300"
                    />
                  </div>
                </div>

                {/* Quick Selection Chips for Weeks and Days */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Quick Weekly Durations:</span>
                    <span className="text-slate-400 text-[10px]">ICMR guideline reference</span>
                  </div>

                  {/* Weekly Duration Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "1 Week (7d)", weeks: 1 },
                      { label: "2 Weeks (14d)", weeks: 2 },
                      { label: "3 Weeks (21d)", weeks: 3 },
                      { label: "4 Weeks (28d)", weeks: 4 },
                      { label: "6 Weeks (42d)", weeks: 6 },
                    ].map((w) => (
                      <button
                        key={w.label}
                        type="button"
                        onClick={() => handleSelectWeeklyDuration(w.weeks)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
                          duration.includes(`${w.weeks} week`)
                            ? "bg-[#169781] text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-[#169781] hover:bg-[#F1F8FC]"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>

                  {/* Standard Short-Course Day Chips */}
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                    <span>Short-course days:</span>
                    {[3, 5, 7, 10].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleSelectDaysDuration(d)}
                        className="px-1.5 py-0.5 rounded bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition-colors"
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculated Live Calendar Schedule Preview */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#169781]" />
                    <span className="text-slate-500 font-medium text-[11px]">Calculated Schedule:</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                    <span>{formatDisplayDate(startDate)}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-[#0D607B]">{calculatedEndDate}</span>
                    <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold bg-[#E2FAD9] text-[#0d5c36]">
                      {parsedDays} Days
                    </Badge>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Action Footer: Close, Add & Add More, and Add Medicine */}
          <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Close
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddAndMore}
                className="flex-1 sm:flex-initial text-xs font-semibold bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add & Add More</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveAndClose()}
                className="flex-1 sm:flex-initial text-xs font-semibold bg-[#169781] hover:bg-[#117866] text-white shadow-2xs gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </Button>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
}
