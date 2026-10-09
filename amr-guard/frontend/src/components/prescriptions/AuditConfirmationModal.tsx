"use client";

import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
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

interface AuditConfirmationModalProps {
  isOpen: boolean;
  caseId: string;
  medicineCount: number;
  onClose: () => void;
}

export function AuditConfirmationModal({
  isOpen,
  caseId,
  medicineCount,
  onClose,
}: AuditConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center p-6 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#E2FAD9] text-[#0d5c36] flex items-center justify-center mx-auto ring-8 ring-[#E2FAD9]/50">
          <ShieldCheck className="w-8 h-8 text-[#169781]" />
        </div>

        <DialogHeader className="space-y-1.5 sm:text-center">
          <div className="flex justify-center">
            <Badge variant="outline" className="gap-1 bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#169781]" />
              <span>Verification Complete</span>
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold text-[#0D607B] pt-1">
            Prescription Ready for Safety Check
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 max-w-sm mx-auto">
            Case <strong className="text-slate-800">{caseId}</strong> with{" "}
            <strong className="text-slate-800">{medicineCount} verified medication(s)</strong> has been locked and saved for prescription safety review.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 bg-[#F1F8FC] border border-[#C9E9EB] rounded-xl text-left text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-[#0D607B] flex items-center justify-between">
            <span>Prescription Status:</span>
            <Badge variant="outline" className="text-[10px] bg-white border-[#C9E9EB] text-[#0D607B]">
              Ready for Review
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data validated: dosage, contraindications, and active molecules will be evaluated against ICMR and WHO antibiotic safety rules.
          </p>
        </div>

        <DialogFooter className="sm:justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-semibold text-slate-600"
          >
            Stay on Verified Case
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto gap-1.5 text-xs font-semibold bg-[#169781] hover:bg-[#117866] text-white"
          >
            <Link href="/dashboard">
              <span>Return to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
