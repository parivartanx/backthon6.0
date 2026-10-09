// [SOLID: SRP] Authoritative Clinical Guideline & Banned Drug Library for AMR Sentinel
"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { 
  WHO_AWARE_DRUGS, 
  CDSCO_BANNED_FDCS, 
  ICMR_OUTPATIENT_GUIDELINES,
  AwareDrugItem,
  BannedFdcItem,
  IcmrGuidelineItem
} from "@/lib/guidelineData";
import { 
  BookOpenText, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Building2, 
  FileText, 
  Scale, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Info,
  Pill
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function GuidelinesLibraryPage() {
  const [activeTab, setActiveTab] = useState<string>("aware");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [awareFilter, setAwareFilter] = useState<string>("ALL");

  // Filter WHO AWaRe Drugs
  const filteredAwareDrugs = useMemo(() => {
    return WHO_AWARE_DRUGS.filter((d) => {
      if (awareFilter !== "ALL" && d.category !== awareFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.genericName.toLowerCase().includes(q) ||
          d.therapeuticClass.toLowerCase().includes(q) ||
          d.indications.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [awareFilter, searchQuery]);

  // Filter CDSCO Banned FDCs
  const filteredBannedFdcs = useMemo(() => {
    return CDSCO_BANNED_FDCS.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.combination.toLowerCase().includes(q) ||
          f.clinicalRationale.toLowerCase().includes(q) ||
          f.gazetteNumber.toLowerCase().includes(q) ||
          f.sanctionedAlternative.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery]);

  // Filter ICMR STGs
  const filteredIcmrGuidelines = useMemo(() => {
    return ICMR_OUTPATIENT_GUIDELINES.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          g.syndrome.toLowerCase().includes(q) ||
          g.code.toLowerCase().includes(q) ||
          g.firstLineTherapy.toLowerCase().includes(q) ||
          g.targetPathogens.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery]);

  return (
    <AppShell
      title="Clinical Guideline & Antibiotic Library"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Guideline Library" },
      ]}
    >
      <div className="space-y-6 max-w-7xl w-full mx-auto pb-12 min-w-0">
        {/* Header Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B] shrink-0">
              <BookOpenText className="w-5 h-5 text-[#169781]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#0D607B] tracking-tight">
                  Official Clinical Guideline Knowledge Base
                </h1>
                <Badge variant="outline" className="text-[10px] bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
                  Authoritative Index
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic standards powering the AMR Sentinel 5-tier audit engine (WHO AWaRe 2023 • ICMR STG • CDSCO Gazette)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap self-start md:self-auto text-xs shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
              WHO AWaRe 2023
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
              ICMR STG 2022–23
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
              CDSCO Banned FDCs
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search across molecules, clinical indications, banned combinations, or syndrome guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs bg-white border-slate-200/90 shadow-2xs w-full"
          />
        </div>

        {/* Multi-Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 min-w-0">
          <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200/80 p-1.5 rounded-xl shadow-2xs h-auto min-h-12 gap-1.5 min-w-0">
            <TabsTrigger
              value="aware"
              className="text-xs font-semibold data-[state=active]:bg-[#169781] data-[state=active]:text-white rounded-lg h-9 transition-all justify-center py-2 px-3"
            >
              WHO AWaRe Classification ({WHO_AWARE_DRUGS.length})
            </TabsTrigger>
            <TabsTrigger
              value="fdc"
              className="text-xs font-semibold data-[state=active]:bg-[#169781] data-[state=active]:text-white rounded-lg h-9 transition-all justify-center py-2 px-3"
            >
              CDSCO Banned FDCs ({CDSCO_BANNED_FDCS.length})
            </TabsTrigger>
            <TabsTrigger
              value="icmr"
              className="text-xs font-semibold data-[state=active]:bg-[#169781] data-[state=active]:text-white rounded-lg h-9 transition-all justify-center py-2 px-3"
            >
              ICMR Outpatient Guidelines ({ICMR_OUTPATIENT_GUIDELINES.length})
            </TabsTrigger>
          </TabsList>

          {/* ======================================================== */}
          {/* TAB 1: WHO AWaRe Classification                          */}
          {/* ======================================================== */}
          <TabsContent value="aware" className="w-full space-y-4 pt-1 min-w-0">
            {/* Filter Bar */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">Filter Tier:</span>
                {[
                  { id: "ALL", label: "All Tiers" },
                  { id: "Access", label: "Access (>60% Target)" },
                  { id: "Watch", label: "Watch (Restricted)" },
                  { id: "Reserve", label: "Reserve (Last Resort)" },
                  { id: "Discouraged", label: "Discouraged / Banned" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setAwareFilter(tier.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                      awareFilter === tier.id
                        ? "bg-[#0D607B] text-white shadow-2xs font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 shrink-0">
                WHO Benchmark: <strong className="text-slate-600 font-semibold">&ge; 60%</strong> Access tier target
              </div>
            </div>

            {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
              {filteredAwareDrugs.map((drug) => (
                <Card
                  key={drug.id}
                  className="p-4 bg-white border border-slate-200/80 hover:border-[#169781]/40 rounded-xl shadow-2xs flex flex-col justify-between min-w-0 w-full overflow-hidden transition-all"
                >
                  <div className="min-w-0 w-full">
                    <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 truncate" title={drug.genericName}>
                          {drug.genericName}
                        </h3>
                        <span className="text-[11px] text-slate-500 block truncate" title={drug.therapeuticClass}>
                          {drug.therapeuticClass}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${
                          drug.category === "Access"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : drug.category === "Watch"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : drug.category === "Reserve"
                            ? "bg-purple-50 text-purple-800 border-purple-300"
                            : "bg-red-50 text-red-800 border-red-300"
                        }`}
                      >
                        {drug.category.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2 mt-3 text-xs min-w-0">
                      <div className="bg-[#F1F8FC] p-2.5 rounded-lg border border-[#C9E9EB]">
                        <span className="text-[10px] uppercase font-bold text-[#0D607B] block">
                          Stewardship Target
                        </span>
                        <p className="text-[11px] text-slate-700 mt-0.5 leading-snug break-words">
                          {drug.whoTarget}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Clinical Indications
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5 break-words">
                          {drug.indications}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[10px] text-amber-800 bg-amber-50/50 p-2.5 rounded-lg min-w-0">
                    <span className="font-bold">Caution: </span>
                    <span className="break-words">{drug.cautions}</span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 2: CDSCO Statutory Banned FDCs                       */}
          {/* ======================================================== */}
          <TabsContent value="fdc" className="w-full space-y-4 pt-1 min-w-0">
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-900 flex items-start gap-3 min-w-0">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-red-900 block">
                  Statutory Directives under Section 26A of Drugs and Cosmetics Act, 1940
                </span>
                <p className="text-[11px] text-red-800 mt-1 leading-relaxed break-words">
                  The Central Drugs Standard Control Organisation (CDSCO) and Ministry of Health & Family Welfare have officially prohibited the manufacture, sale, and distribution of irrational fixed-dose antimicrobial combinations. Prescriptions containing these combinations are automatically <strong>BLOCKED (Risk Score = 100)</strong> in AMR Sentinel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0">
              {filteredBannedFdcs.map((fdc) => (
                <Card
                  key={fdc.id}
                  className="p-5 bg-white border border-red-200/80 shadow-2xs flex flex-col justify-between min-w-0 w-full overflow-hidden"
                >
                  <div className="min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                          BAN
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-red-900 truncate">
                          {fdc.combination}
                        </h3>
                      </div>
                      <Badge variant="destructive" className="text-[10px] font-mono px-2 py-0.5 shrink-0 self-start sm:self-auto">
                        {fdc.gazetteNumber}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs min-w-0">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Clinical Rationale for Prohibition
                        </span>
                        <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80 break-words">
                          {fdc.clinicalRationale}
                        </p>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                          Sanctioned Alternative (1-Click Remediation)
                        </span>
                        <p className="text-emerald-900 text-xs leading-relaxed bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 break-words">
                          {fdc.sanctionedAlternative}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 min-w-0">
                    <span className="truncate">{fdc.effectiveDate}</span>
                    <span className="font-semibold text-red-600 shrink-0 ml-2">Zero Tolerance Enforcement</span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 3: ICMR Outpatient Guidelines                        */}
          {/* ======================================================== */}
          <TabsContent value="icmr" className="w-full space-y-4 pt-1 min-w-0">
            <div className="bg-[#F1F8FC] border border-[#C9E9EB] p-4 rounded-xl text-xs text-[#0D607B] flex items-start gap-3 min-w-0">
              <Building2 className="w-5 h-5 text-[#169781] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[#0D607B] block">
                  Indian Council of Medical Research (ICMR) Standard Treatment Guidelines (STG)
                </span>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed break-words">
                  National clinical benchmarks for antimicrobial use in outpatient medicine. Outlines syndrome-first empirical choices, preventing the unnecessary escalation to broad-spectrum cephalosporins and macrolides.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0">
              {filteredIcmrGuidelines.map((stg) => (
                <Card
                  key={stg.id}
                  className="p-5 bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between min-w-0 w-full overflow-hidden"
                >
                  <div className="min-w-0 w-full">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-[#0D607B] truncate">{stg.syndrome}</h3>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold block">{stg.code}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 font-semibold shrink-0">
                        ICMR STG
                      </Badge>
                    </div>

                    <div className="space-y-2.5 mt-3 text-xs min-w-0">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Predominant Pathogens
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5 break-words">{stg.targetPathogens}</p>
                      </div>

                      <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                          First-Line Empirical Protocol
                        </span>
                        <div className="font-bold text-xs text-emerald-950 mt-0.5 break-words">
                          {stg.firstLineTherapy}
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-1 break-words">
                          <strong>Dose: </strong> {stg.firstLineDose} &bull; <strong>Duration: </strong> {stg.durationDays}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] min-w-0">
                        <span className="font-bold text-slate-700">Pediatric Guidance: </span>
                        <span className="text-slate-600 break-words">{stg.pediatricGuidance}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 min-w-0">
                    <div className="text-[10px] text-red-800 bg-red-50 p-2 rounded-lg border border-red-100 min-w-0">
                      <span className="font-bold">Red Flags: </span>
                      <span className="break-words">{stg.redFlagsAndContraindications}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-1 truncate">
                      Ref: {stg.icmrReference}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
