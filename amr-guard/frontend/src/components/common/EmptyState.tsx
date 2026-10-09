"use client";

import * as React from "react";
import { LucideIcon, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileQuestion,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center my-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[#F1F8FC] flex items-center justify-center text-[#0D607B] mb-3">
        <Icon className="w-6 h-6 text-[#169781]" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mb-4">{description}</p>
      {actionText && onAction && (
        <Button
          type="button"
          onClick={onAction}
          className="bg-[#169781] hover:bg-[#117866] text-white text-xs font-semibold shadow-xs"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
