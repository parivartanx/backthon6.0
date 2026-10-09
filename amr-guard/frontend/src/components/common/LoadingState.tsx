"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function LoadingState({
  message = "Extracting prescription data...",
  subMessage = "Parsing clinical entities, dosages and schedules",
}: LoadingStateProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center my-4 space-y-3">
      <div className="w-12 h-12 rounded-full bg-[#F1F8FC] flex items-center justify-center text-[#169781]">
        <Loader2 className="w-6 h-6 animate-spin text-[#169781]" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{message}</h4>
        <p className="text-xs text-slate-500 mt-1">{subMessage}</p>
      </div>
      <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#169781] rounded-full animate-pulse w-3/4" />
      </div>
    </div>
  );
}
