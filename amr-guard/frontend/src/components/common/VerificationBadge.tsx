"use client";

import { MedicineVerificationStatus } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

interface VerificationBadgeProps {
  status: MedicineVerificationStatus;
  showHelpIcon?: boolean;
  onClick?: () => void;
}

// [SOLID: SRP] Clinical data status badge built on shadcn/ui Badge with optional click-to-verify action
export function VerificationBadge({ status, showHelpIcon = false, onClick }: VerificationBadgeProps) {
  const isClickable = Boolean(onClick);

  if (status === "Verified") {
    return (
      <Badge
        variant="outline"
        onClick={onClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/25 ${
          isClickable ? "cursor-pointer hover:bg-[#c9f3bc] hover:border-[#169781]/50 active:scale-95 transition-all select-none" : "hover:bg-[#E2FAD9]"
        }`}
        title={isClickable ? "Verified (click to change status)" : "Data Completeness: All standard dosage, frequency and duration parameters extracted."}
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
        onClick={onClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border-amber-300/70 ${
          isClickable ? "cursor-pointer hover:bg-amber-100 hover:border-amber-400 hover:text-amber-900 active:scale-95 transition-all select-none" : "hover:bg-amber-50"
        }`}
        title={isClickable ? "Click to mark as Verified" : "Uncertain or partial extraction: Dose, frequency, or duration requires clinician confirmation."}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>Needs Verification</span>
        {isClickable && <span className="text-[10px] opacity-70 underline ml-0.5 font-normal">Click to verify</span>}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-800 border-red-300/70 ${
        isClickable ? "cursor-pointer hover:bg-red-100 hover:border-red-400 active:scale-95 transition-all select-none" : "hover:bg-red-50"
      }`}
      title={isClickable ? "Click to mark as Verified" : "Critical fields missing: Requires manual physician entry before prescription safety check."}
    >
      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
      <span>Missing Data</span>
      {isClickable && <span className="text-[10px] opacity-70 underline ml-0.5 font-normal">Click to verify</span>}
    </Badge>
  );
}
