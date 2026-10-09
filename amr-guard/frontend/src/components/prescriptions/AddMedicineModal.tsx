"use client";

import { useState } from "react";
import { MedicineEntry } from "@/types/prescription";
import { Pill, PlusCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (medicine: MedicineEntry) => void;
}

// [SOLID: SRP] Add Medicine modal upgraded to shadcn/ui Dialog, Input, and Button
export function AddMedicineModal({ isOpen, onClose, onAdd }: AddMedicineModalProps) {
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [strength, setStrength] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("Oral");
  const [frequency, setFrequency] = useState("Twice daily (BD)");
  const [duration, setDuration] = useState("5 days");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() && !genericName.trim()) {
      setError("Please provide either a Medicine Brand Name or Generic Name.");
      return;
    }
    if (!dose.trim()) {
      setError("Dose is required (e.g. 1 tablet, 500 mg, 5 mL).");
      return;
    }

    const newMed: MedicineEntry = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      brandName: brandName.trim() || genericName.trim(),
      genericName: genericName.trim() || brandName.trim(),
      strength: strength.trim() || "Standard",
      dose: dose.trim(),
      route: route.trim() || "Oral",
      frequency: frequency.trim(),
      duration: duration.trim(),
      verificationStatus: duration.trim() ? "Verified" : "Needs Verification",
    };

    onAdd(newMed);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-white sm:rounded-2xl border border-slate-200">
        {/* Header */}
        <DialogHeader className="px-5 py-4 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E2FAD9] flex items-center justify-center text-[#0d5c36]">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-[#0D607B]">
                Add Prescribed Medicine
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500">
                Manually append an antimicrobial or adjunct medication
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2 px-3 text-xs">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={brandName}
                onChange={(e) => {
                  setBrandName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Augmentin, Taxim-O"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Generic Name (Active Molecule)
              </label>
              <Input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Amoxicillin + Clavulanate"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Strength
              </label>
              <Input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 625 mg, 200 mg"
                className="h-8 text-xs"
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
                placeholder="e.g. 1 tablet, 5 mL"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Route
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-300 focus:border-[#169781] focus:ring-2 focus:ring-[#E2FAD9] focus:outline-none bg-white"
              >
                <option value="Oral">Oral (PO)</option>
                <option value="Intravenous">Intravenous (IV)</option>
                <option value="Intramuscular">Intramuscular (IM)</option>
                <option value="Inhalation">Inhalation</option>
                <option value="Topical">Topical</option>
                <option value="Sublingual">Sublingual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-300 focus:border-[#169781] focus:ring-2 focus:ring-[#E2FAD9] focus:outline-none bg-white"
              >
                <option value="Once daily (OD)">Once daily (OD)</option>
                <option value="Twice daily (BD)">Twice daily (BD)</option>
                <option value="Three times daily (TID)">Three times daily (TID)</option>
                <option value="Four times daily (QID)">Four times daily (QID)</option>
                <option value="As needed (SOS)">As needed (SOS)</option>
                <option value="At bedtime (HS)">At bedtime (HS)</option>
                <option value="Stat (Immediate)">Stat (Immediate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration
              </label>
              <Input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 5 days, 7 days"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#169781] hover:bg-[#117866] text-white text-xs gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add to Prescription</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
