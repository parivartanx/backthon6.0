"use client";

import { LucideIcon, FileQuestion } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileQuestion,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center my-4">
      <div className="w-12 h-12 rounded-full bg-[#F1F8FC] flex items-center justify-center text-[#0D607B] mb-3">
        <Icon className="w-6 h-6 text-[#169781]" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mb-4">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#169781] hover:bg-[#117866] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
