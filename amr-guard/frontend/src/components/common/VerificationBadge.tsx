"use client";

import { MedicineVerificationStatus } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

interface VerificationBadgeProps {
  status: MedicineVerificationStatus;
  showHelpIcon?: boolean;
}

// [SOLID: SRP] Clinical data status badge built on shadcn/ui Badge
export function VerificationBadge({ status, showHelpIcon = false }: VerificationBadgeProps) {
  if (status === "Verified") {
    return (
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/25 hover:bg-[#E2FAD9]"
        title="Data Completeness: All standard dosage, frequency and duration parameters extracted."
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#169781]" />
        <span>Verified</span>
        {showHelpIcon && <span className="text-[10px] opacity-75">(Data complete)</span>}
      </Badge>
    );
  }

  if (status === "Needs Verification") {
    return (
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border-amber-300/70 hover:bg-amber-50"
        title="Uncertain or partial extraction: Dose, frequency, or duration requires clinician confirmation."
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>Needs Verification</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-800 border-red-300/70 hover:bg-red-50"
      title="Critical fields missing: Requires manual physician entry before prescription safety check."
    >
      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
      <span>Missing Data</span>
    </Badge>
  );
}
