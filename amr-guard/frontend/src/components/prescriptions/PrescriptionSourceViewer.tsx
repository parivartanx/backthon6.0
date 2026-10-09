"use client";

import { useState } from "react";
import { Eye, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PrescriptionSourceViewerProps {
  sourceType: "upload" | "manual";
  sourceText?: string;
  imagePreviewUrl?: string;
  imageFileName?: string;
}

export function PrescriptionSourceViewer({
  sourceType,
  sourceText = "",
  imagePreviewUrl,
  imageFileName,
}: PrescriptionSourceViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (sourceText) {
      navigator.clipboard.writeText(sourceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (isCollapsed) {
    return (
      <div className="h-full bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-start shadow-2xs">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-slate-500 hover:text-[#0D607B]"
          title="Expand Prescription Source Document"
          aria-label="Expand Prescription Source Document"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        <div className="mt-4 [writing-mode:vertical-rl] rotate-180 text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Original Source
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sourceType === "upload" ? (
            <ImageIcon className="w-4 h-4 text-[#0D607B]" />
          ) : (
            <FileText className="w-4 h-4 text-[#0D607B]" />
          )}
          <span className="text-xs font-bold text-[#0D607B] uppercase tracking-wide">
            {sourceType === "upload" ? "Original Document Scan" : "Original Clinical Notes"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {sourceText && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-7 w-7 text-slate-400 hover:text-[#0D607B]"
              title="Copy original notes"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
            title="Collapse reference panel"
            aria-label="Collapse reference panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content View */}
      <div className="p-4 flex-1 overflow-y-auto">
        {sourceType === "upload" && imagePreviewUrl ? (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt="Prescription Scan Reference"
                className="max-h-[500px] w-auto object-contain rounded"
              />
            </div>
            {imageFileName && (
              <p className="text-[11px] text-slate-400 text-center font-mono">
                {imageFileName}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
              {sourceText || "No original prescription text recorded."}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Cross-reference extracted medicine names, frequencies, and strengths against these source notes.
            </p>
          </div>
        )}
      </div>

      {/* Footer Guidance */}
      <div className="p-3 bg-[#F1F8FC] border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-[#169781] shrink-0" />
        <span>Side-by-side reference for verification</span>
      </div>
    </div>
  );
}
