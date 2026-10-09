// [SOLID: SRP] Ultra-compact Authoritative Clinical Data Attribution Footer for AMR Sentinel
"use client";

import React, { useState } from "react";
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  Scale
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DataSourceItem {
  id: string;
  name: string;
  shortName: string;
  publisher: string;
  category: string;
  keyContributions: string;
  year: string;
  status: string;
}

const DATA_SOURCES: DataSourceItem[] = [
  {
    id: "who",
    name: "World Health Organization",
    shortName: "WHO",
    publisher: "World Health Organization, Geneva",
    category: "Global Antimicrobial Stewardship & AWaRe Framework",
    keyContributions:
      "AWaRe classification tiers (Access, Watch, Reserve), Global Antimicrobial Resistance and Use Surveillance System (GLASS), and WHO Model List of Essential Medicines (EML).",
    year: "2023",
    status: "Primary Standard",
  },
  {
    id: "icmr",
    name: "Indian Council of Medical Research",
    shortName: "ICMR",
    publisher: "Department of Health Research, Ministry of Health and Family Welfare (MoHFW), Govt of India",
    category: "National Standard Treatment Guidelines (STG)",
    keyContributions:
      "Treatment Guidelines for Antimicrobial Use in Common Syndromes (Pediatrics, Respiratory, Urology, Sepsis) and Antimicrobial Resistance Surveillance Network (AMRSN) annual resistance data.",
    year: "2022–2023",
    status: "Clinical Standard",
  },
  {
    id: "ncdc",
    name: "National Centre for Disease Control",
    shortName: "NCDC",
    publisher: "Directorate General of Health Services, MoHFW, Govt of India",
    category: "National Programme on AMR Containment",
    keyContributions:
      "NARS-Net India Surveillance Reports (2017–2023), pathogen sensitivity benchmarks, and Outpatient Antimicrobial Usage Guidelines.",
    year: "2017–2023",
    status: "Surveillance Index",
  },
  {
    id: "cdsco",
    name: "Central Drugs Standard Control Organisation",
    shortName: "CDSCO",
    publisher: "National Regulatory Authority, MoHFW, Govt of India",
    category: "Banned Drug Combinations & Regulatory Directives",
    keyContributions:
      "Statutory Gazette notifications banning irrational dual-antimicrobial Fixed-Dose Combinations (e.g. Cefixime + Azithromycin, Ofloxacin + Ornidazole).",
    year: "Gazette Notifications",
    status: "Regulatory Enforcement",
  },
];

export function AppFooter() {
  const [selectedSource, setSelectedSource] = useState<DataSourceItem | null>(null);

  return (
    <>
      <footer className="mt-8 bg-white border-t border-slate-200 text-slate-600 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-6 h-6 rounded-md overflow-hidden bg-gradient-to-br from-[#0D607B] to-[#169781] p-0.5 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/vector2.jpeg" 
                  alt="AMR Sentinel" 
                  className="w-full h-full object-cover rounded-[5px]" 
                />
              </div>
              <span className="font-bold text-xs text-[#0D607B] tracking-tight">AMR Sentinel</span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Data Provenance:
              </span>
            </div>

            {/* Center: Compact Interactive Institutional Provenance Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {DATA_SOURCES.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedSource(source)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 hover:bg-[#F1F8FC] border border-slate-200 hover:border-[#169781]/40 text-slate-700 hover:text-[#0D607B] transition-all cursor-pointer"
                  title={`View official ${source.shortName} attribution details`}
                >
                  <span className="text-[#169781] font-bold">{source.shortName}</span>
                  <span className="text-slate-400 font-normal">({source.status.split(" ")[0]})</span>
                  <Info className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                </button>
              ))}
            </div>

            {/* Right: Governance Notice & Copyright */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
              <span className="hidden lg:inline text-slate-500 font-medium">100% Deterministic Engine</span>
              <span className="hidden lg:inline text-slate-300">•</span>
              <span>© {new Date().getFullYear()} AMR Sentinel</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Data Source Detail Modal */}
      <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
        {selectedSource && (
          <DialogContent className="sm:max-w-md p-5 space-y-4">
            <DialogHeader className="border-b border-slate-100 pb-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B]">
                  <Building2 className="w-4 h-4 text-[#169781]" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-[#0D607B]">
                    {selectedSource.name} ({selectedSource.shortName})
                  </DialogTitle>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedSource.category}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Authority & Publishing Body
                </div>
                <div className="font-medium text-slate-700">
                  {selectedSource.publisher}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Key Rules & Datasets Integrated
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px] bg-[#F1F8FC] p-2.5 rounded-lg border border-[#C9E9EB]">
                  {selectedSource.keyContributions}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Benchmark Year:</span>
                  <span className="font-semibold text-slate-700">{selectedSource.year}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px]">Audit Role:</span>
                  <span className="font-semibold text-emerald-800">{selectedSource.status}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
                <span>Deterministic STG Verification</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedSource(null)}
                className="text-xs h-7 px-3 text-slate-700"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
