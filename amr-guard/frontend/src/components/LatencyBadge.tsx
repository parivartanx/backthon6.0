// [SOLID: SRP] Execution Latency Badge for AMR Sentinel with Micro-Pulse Interaction
"use client";

import React from "react";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LatencyBadgeProps {
  latencyMs?: number;
  className?: string;
}

export function LatencyBadge({ latencyMs = 3, className = "" }: LatencyBadgeProps) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className={`gap-1.5 px-2.5 py-1 bg-emerald-50/80 border-emerald-300 text-emerald-800 font-mono text-[11px] cursor-help shadow-2xs hover:bg-emerald-100/70 transition-colors ${className}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            <span>{latencyMs}ms Deterministic</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs bg-slate-900 text-white p-2.5 rounded-lg shadow-xl">
          <p className="font-semibold text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Zero-LLM Fast Path
          </p>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            Evaluated purely against compiled mathematical constraint tables derived from ICMR Standard Treatment Guidelines. No generative hallucinations.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
