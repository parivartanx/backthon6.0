"use client";

import { useState } from "react";
import { MedicineEntry, MedicineVerificationStatus } from "@/types/prescription";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Pill, 
  Edit2, 
  Trash2, 
  Check, 
  CheckCheck,
  X, 
  Plus, 
  AlertCircle,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import { AddMedicineModal } from "./AddMedicineModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedicineTableProps {
  medicines: MedicineEntry[];
  onChange: (updatedList: MedicineEntry[]) => void;
  disabled?: boolean;
}

// [SOLID: SRP & DRY] Medicine verification table built on shadcn/ui Table primitives
export function MedicineTable({
  medicines,
  onChange,
  disabled = false,
}: MedicineTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<MedicineEntry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MedicineEntry | null>(null);

  // Start editing row
  const startEditing = (med: MedicineEntry) => {
    if (disabled) return;
    setEditingId(med.id);
    setEditFormData({
      ...med,
      brandName: med.brandName || "",
      genericName: med.genericName || "",
      strength: med.strength || "",
      dose: med.dose || "",
      route: med.route || "Oral",
      frequency: med.frequency || "",
      duration: med.duration || "",
    });
  };

  // Cancel editing row
  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  // Save edited row
  const saveEditing = () => {
    if (!editFormData) return;
    const isComplete =
      Boolean(editFormData.brandName?.trim()) &&
      Boolean(editFormData.dose?.trim()) &&
      Boolean(editFormData.route?.trim()) &&
      Boolean(editFormData.frequency?.trim()) &&
      Boolean(editFormData.duration?.trim());

    const updatedMed: MedicineEntry = {
      ...editFormData,
      brandName: editFormData.brandName.trim() || "Unnamed Medication",
      dose: editFormData.dose.trim() || "Unspecified",
      verificationStatus: isComplete ? "Verified" : "Needs Verification",
    };

    const updatedList = medicines.map((m) => (m.id === updatedMed.id ? updatedMed : m));
    onChange(updatedList);
    setEditingId(null);
    setEditFormData(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const updatedList = medicines.filter((m) => m.id !== itemToDelete.id);
    onChange(updatedList);
    setItemToDelete(null);
  };

  // [SOLID: SRP] Fast 1-click verification toggles without editing
  const handleToggleVerify = (medId: string, forcedStatus?: MedicineVerificationStatus) => {
    if (disabled) return;
    const updatedList = medicines.map((m) => {
      if (m.id !== medId) return m;
      const nextStatus: MedicineVerificationStatus =
        forcedStatus !== undefined
          ? forcedStatus
          : m.verificationStatus === "Verified"
          ? "Needs Verification"
          : "Verified";
      return {
        ...m,
        verificationStatus: nextStatus,
      };
    });
    onChange(updatedList);
  };

  const handleAddMedicine = (newMed: MedicineEntry) => {
    onChange([...medicines, newMed]);
  };

  const handleMarkAllVerified = () => {
    if (disabled) return;
    const updatedList = medicines.map((m) => ({
      ...m,
      verificationStatus: "Verified" as MedicineVerificationStatus,
    }));
    onChange(updatedList);
  };

  const unverifiedCount = medicines.filter((m) => m.verificationStatus !== "Verified").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Table Header / Action Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E2FAD9] flex items-center justify-center text-[#0d5c36]">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0D607B]">
                Extracted Prescribed Medicines
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                {medicines.length} {medicines.length === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Verify dosage, active molecule, frequency and duration before clinical review
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {unverifiedCount > 0 && (
            <Button
              type="button"
              onClick={handleMarkAllVerified}
              disabled={disabled}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold text-[#0d5c36] bg-[#E2FAD9]/60 hover:bg-[#E2FAD9] border-[#169781]/30 hover:border-[#169781] shadow-2xs"
              title="Mark all medications as verified without editing them"
            >
              <CheckCheck className="w-4 h-4 text-[#169781]" />
              <span>Mark All as Verified ({unverifiedCount})</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            disabled={disabled}
            size="sm"
            className="gap-1.5 text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </Button>
        </div>
      </div>

      {/* Official shadcn Table Container */}
      <div className="overflow-x-auto">
        {medicines.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No medicines recorded yet. Click &quot;Add Medicine&quot; to enter prescribed items.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-3 px-4">Medicine (Brand)</TableHead>
                <TableHead className="py-3 px-4">Generic Name</TableHead>
                <TableHead className="py-3 px-3">Strength & Dose</TableHead>
                <TableHead className="py-3 px-3">Route / Frequency</TableHead>
                <TableHead className="py-3 px-3">Duration</TableHead>
                <TableHead className="py-3 px-3">Data Status</TableHead>
                <TableHead className="py-3 px-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((med) => {
                const isEditing = editingId === med.id;
                const isNeedsVerification = med.verificationStatus !== "Verified";

                if (isEditing && editFormData) {
                  return (
                    <TableRow
                      key={med.id}
                      className="bg-[#F1F8FC]/70 ring-2 ring-inset ring-[#169781]/40"
                      onKeyDown={handleKeyDown}
                    >
                      {/* Brand Name Input */}
                      <TableCell className="py-2.5 px-3">
                        <Input
                          type="text"
                          value={editFormData.brandName || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, brandName: e.target.value })
                          }
                          placeholder="Brand name"
                          className="h-8 text-xs bg-white"
                          autoFocus
                        />
                      </TableCell>

                      {/* Generic Name Input */}
                      <TableCell className="py-2.5 px-3">
                        <Input
                          type="text"
                          value={editFormData.genericName || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, genericName: e.target.value })
                          }
                          placeholder="Generic name"
                          className="h-8 text-xs bg-white"
                        />
                      </TableCell>

                      {/* Strength & Dose Inputs */}
                      <TableCell className="py-2.5 px-2">
                        <div className="space-y-1">
                          <Input
                            type="text"
                            value={editFormData.strength || ""}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, strength: e.target.value })
                            }
                            placeholder="Strength (e.g. 200 mg)"
                            className="h-7 text-xs bg-white"
                          />
                          <Input
                            type="text"
                            value={editFormData.dose || ""}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, dose: e.target.value })
                            }
                            placeholder="Dose (e.g. 1 tab)"
                            className="h-7 text-xs bg-white"
                          />
                        </div>
                      </TableCell>

                      {/* Route & Frequency Inputs */}
                      <TableCell className="py-2.5 px-2">
                        <div className="space-y-1">
                          <Select
                            value={editFormData.route || "Oral"}
                            onValueChange={(val: string | null) =>
                              setEditFormData({ ...editFormData, route: val || "Oral" })
                            }
                          >
                            <SelectTrigger className="w-full px-2 h-7 text-xs bg-white border-slate-300">
                              <SelectValue placeholder="Route" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Oral">Oral</SelectItem>
                              <SelectItem value="Intravenous">Intravenous</SelectItem>
                              <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                              <SelectItem value="Inhalation">Inhalation</SelectItem>
                              <SelectItem value="Topical">Topical</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="text"
                            value={editFormData.frequency || ""}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, frequency: e.target.value })
                            }
                            placeholder="Frequency (e.g. BD)"
                            className="h-7 text-xs bg-white"
                          />
                        </div>
                      </TableCell>

                      {/* Duration Input */}
                      <TableCell className="py-2.5 px-2">
                        <Input
                          type="text"
                          value={editFormData.duration || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, duration: e.target.value })
                          }
                          placeholder="e.g. 5 days"
                          className="h-8 text-xs bg-white"
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2.5 px-2">
                        <span className="text-[11px] text-slate-500 italic">Editing...</span>
                      </TableCell>

                      {/* Inline Action buttons */}
                      <TableCell className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            onClick={saveEditing}
                            className="h-7 w-7 text-white bg-[#169781] hover:bg-[#117866]"
                            title="Save changes (Enter)"
                            aria-label="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={cancelEditing}
                            className="h-7 w-7 text-slate-500 hover:bg-slate-200"
                            title="Cancel editing (Esc)"
                            aria-label="Cancel editing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow
                    key={med.id}
                    className={`hover:bg-slate-50/80 transition-colors group ${
                      isNeedsVerification ? "bg-amber-50/30" : ""
                    }`}
                  >
                    {/* Brand Name */}
                    <TableCell className="py-3 px-4 font-semibold text-slate-900">
                      <span>{med.brandName}</span>
                    </TableCell>

                    {/* Generic Name */}
                    <TableCell className="py-3 px-4 text-slate-700">
                      <span className="font-mono text-[12px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                        {med.genericName || "—"}
                      </span>
                    </TableCell>

                    {/* Strength & Dose */}
                    <TableCell className="py-3 px-3 text-slate-700">
                      <div>
                        <span className="font-medium text-slate-800">{med.dose}</span>
                        {med.strength && (
                          <span className="text-[11px] text-slate-400 block">
                            ({med.strength})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Route & Frequency */}
                    <TableCell className="py-3 px-3 text-slate-700">
                      <div>
                        <span className="font-medium text-slate-800">{med.frequency}</span>
                        <span className="text-[11px] text-slate-500 block">
                          Route: {med.route || "Oral"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="py-3 px-3">
                      {med.duration ? (
                        <span className="font-semibold text-slate-800 bg-[#E2FAD9]/60 px-2 py-0.5 rounded text-[11px]">
                          {med.duration}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3" />
                          <span>Missing</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3 px-3">
                      <VerificationBadge
                        status={med.verificationStatus}
                        onClick={disabled ? undefined : () => handleToggleVerify(med.id)}
                      />
                    </TableCell>

                    {/* Row Actions */}
                    <TableCell className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        {med.verificationStatus !== "Verified" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleVerify(med.id, "Verified")}
                            disabled={disabled}
                            className="h-7 px-2 text-xs font-semibold text-[#0d5c36] bg-[#E2FAD9]/70 hover:bg-[#cbf4be] border-[#169781]/35 hover:border-[#169781] gap-1 shadow-2xs mr-0.5"
                            title="Mark this medicine as verified without editing"
                            aria-label={`Mark ${med.brandName} as verified`}
                          >
                            <Check className="w-3.5 h-3.5 text-[#169781]" />
                            <span>Verify</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(med)}
                          disabled={disabled}
                          className="h-7 w-7 text-slate-500 hover:text-[#0D607B] hover:bg-slate-100"
                          title="Edit row details"
                          aria-label={`Edit ${med.brandName}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setItemToDelete(med)}
                          disabled={disabled}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete medication"
                          aria-label={`Delete ${med.brandName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Clinical Disclaimer Notice */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            <strong>Fast Verification:</strong> Click the green <em>Verify</em> button or click any status badge to verify an item directly without manual editing.
          </span>
        </div>
        <span className="text-slate-400 hidden sm:inline shrink-0">Press Enter to save inline edits</span>
      </div>

      {/* Add Modal */}
      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMedicine}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="sm:max-w-sm p-5 space-y-4">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-slate-800">
                  Delete Medication?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove <strong>{itemToDelete?.brandName}</strong> from this prescription?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItemToDelete(null)}
              className="text-xs font-medium text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmDelete}
              className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
