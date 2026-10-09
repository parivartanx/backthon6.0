"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  WHO_AWARE_DRUGS,
  CDSCO_BANNED_FDCS,
  ICMR_OUTPATIENT_GUIDELINES,
} from "@/lib/guidelineData";
import {
  Search,
  Pill,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Info,
  X,
  ArrowRight,
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

  // Search filtering logic across all 3 datasets
  const filteredAwareDrugs = useMemo(() => {
    return WHO_AWARE_DRUGS.filter((d) => {
      if (awareFilter !== "ALL" && d.category !== awareFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.genericName.toLowerCase().includes(q) ||
        d.therapeuticClass.toLowerCase().includes(q) ||
        d.indications.toLowerCase().includes(q) ||
        d.whoTarget.toLowerCase().includes(q)
      );
    });
  }, [awareFilter, searchQuery]);

  const filteredBannedFdcs = useMemo(() => {
    return CDSCO_BANNED_FDCS.filter((f) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.combination.toLowerCase().includes(q) ||
        f.clinicalRationale.toLowerCase().includes(q) ||
        f.sanctionedAlternative.toLowerCase().includes(q) ||
        f.gazetteNumber.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const filteredIcmrGuidelines = useMemo(() => {
    return ICMR_OUTPATIENT_GUIDELINES.filter((g) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.syndrome.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        g.firstLineTherapy.toLowerCase().includes(q) ||
        g.targetPathogens.toLowerCase().includes(q) ||
        g.pediatricGuidance.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Counts for tabs when searching
  const awareTotalMatches = useMemo(() => {
    if (!searchQuery.trim()) return WHO_AWARE_DRUGS.length;
    const q = searchQuery.toLowerCase();
    return WHO_AWARE_DRUGS.filter(
      (d) =>
        d.genericName.toLowerCase().includes(q) ||
        d.therapeuticClass.toLowerCase().includes(q) ||
        d.indications.toLowerCase().includes(q)
    ).length;
  }, [searchQuery]);

  const fdcTotalMatches = useMemo(() => {
    if (!searchQuery.trim()) return CDSCO_BANNED_FDCS.length;
    const q = searchQuery.toLowerCase();
    return CDSCO_BANNED_FDCS.filter(
      (f) =>
        f.combination.toLowerCase().includes(q) ||
        f.clinicalRationale.toLowerCase().includes(q) ||
        f.sanctionedAlternative.toLowerCase().includes(q)
    ).length;
  }, [searchQuery]);

  const icmrTotalMatches = useMemo(() => {
    if (!searchQuery.trim()) return ICMR_OUTPATIENT_GUIDELINES.length;
    const q = searchQuery.toLowerCase();
    return ICMR_OUTPATIENT_GUIDELINES.filter(
      (g) =>
        g.syndrome.toLowerCase().includes(q) ||
        g.firstLineTherapy.toLowerCase().includes(q) ||
        g.targetPathogens.toLowerCase().includes(q)
    ).length;
  }, [searchQuery]);

  return (
    <AppShell
      title="Clinical Guidelines & Antibiotic Formulary"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clinical Guidelines" },
      ]}
    >
      <div className="space-y-6 max-w-7xl w-full mx-auto pb-16 min-w-0">
        {/* Header Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Clinical Guidelines &amp; Formulary
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold"
                >
                  Official Reference
                </Badge>
              </div>
              <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
                National and global clinical standards for outpatient antimicrobial prescribing,
                featuring the WHO AWaRe classification, ICMR empirical treatment protocols, and
                CDSCO prohibited drug combinations.
              </p>
            </div>

            {/* Quick Reference Metrics */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">
                  Antibiotics
                </span>
                <span className="text-base font-bold text-slate-800">
                  {WHO_AWARE_DRUGS.length} Listed
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">
                  Protocols
                </span>
                <span className="text-base font-bold text-slate-800">
                  {ICMR_OUTPATIENT_GUIDELINES.length} Syndromes
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">
                  Prohibited
                </span>
                <span className="text-base font-bold text-amber-700">
                  {CDSCO_BANNED_FDCS.length} Banned
                </span>
              </div>
            </div>
          </div>

          {/* Unified Search Input */}
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search across medicines, clinical conditions, indications, or alternatives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-11 text-sm bg-slate-50/70 border-slate-200 focus:bg-white transition-all w-full rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full space-y-6"
        >
          <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200/80 p-1.5 rounded-xl shadow-2xs h-auto min-h-12 gap-1.5">
            <TabsTrigger
              value="aware"
              className="text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0D607B] data-[state=active]:text-white rounded-lg h-10 transition-all flex items-center justify-center gap-2 py-2 px-3"
            >
              <Pill className="w-4 h-4 shrink-0" />
              <span>WHO AWaRe Formulary</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "aware"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {awareTotalMatches}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="icmr"
              className="text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0D607B] data-[state=active]:text-white rounded-lg h-10 transition-all flex items-center justify-center gap-2 py-2 px-3"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>ICMR Treatment Guidelines</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "icmr"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {icmrTotalMatches}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="fdc"
              className="text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0D607B] data-[state=active]:text-white rounded-lg h-10 transition-all flex items-center justify-center gap-2 py-2 px-3"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Banned Combinations</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "fdc"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {fdcTotalMatches}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Cross-tab search reminder if current tab has zero matches but another tab has matches */}
          {searchQuery && (
            <>
              {activeTab === "aware" && filteredAwareDrugs.length === 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <span>No matches found in WHO AWaRe Formulary for &ldquo;{searchQuery}&rdquo;.</span>
                  {icmrTotalMatches > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("icmr")}
                      className="text-xs text-[#0D607B] border-[#0D607B]/30 hover:bg-[#0D607B]/5"
                    >
                      View in ICMR Guidelines ({icmrTotalMatches}) &rarr;
                    </Button>
                  )}
                </div>
              )}
              {activeTab === "icmr" && filteredIcmrGuidelines.length === 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <span>No matches found in ICMR Treatment Guidelines for &ldquo;{searchQuery}&rdquo;.</span>
                  {awareTotalMatches > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("aware")}
                      className="text-xs text-[#0D607B] border-[#0D607B]/30 hover:bg-[#0D607B]/5"
                    >
                      View in WHO AWaRe ({awareTotalMatches}) &rarr;
                    </Button>
                  )}
                </div>
              )}
              {activeTab === "fdc" && filteredBannedFdcs.length === 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <span>No matches found in Banned Combinations for &ldquo;{searchQuery}&rdquo;.</span>
                  {awareTotalMatches > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("aware")}
                      className="text-xs text-[#0D607B] border-[#0D607B]/30 hover:bg-[#0D607B]/5"
                    >
                      View in WHO AWaRe ({awareTotalMatches}) &rarr;
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 1: WHO AWaRe Classification                          */}
          {/* ======================================================== */}
          <TabsContent value="aware" className="space-y-5">
            {/* Filter and Legend Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1">
                  Category:
                </span>
                {[
                  { id: "ALL", label: "All Antibiotics" },
                  { id: "Access", label: "Access (Preferred)" },
                  { id: "Watch", label: "Watch (Restricted)" },
                  { id: "Reserve", label: "Reserve (Last Resort)" },
                  { id: "Discouraged", label: "Discouraged" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setAwareFilter(tier.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      awareFilter === tier.id
                        ? "bg-[#0D607B] text-white font-semibold shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Simplified educational indicator */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Access (&gt;60% target)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Watch</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>Reserve</span>
                </span>
              </div>
            </div>

            {/* Drug Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAwareDrugs.map((drug) => {
                const isAccess = drug.category === "Access";
                const isWatch = drug.category === "Watch";
                const isReserve = drug.category === "Reserve";

                return (
                  <Card
                    key={drug.id}
                    className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl shadow-2xs flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-3">
                      {/* Card Title & Category */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="min-w-0">
                          <h2 className="font-bold text-base text-slate-900 truncate">
                            {drug.genericName}
                          </h2>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {drug.therapeuticClass}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold px-2.5 py-0.5 shrink-0 ${
                            isAccess
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : isWatch
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : isReserve
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          {drug.category.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Indications */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Clinical Indications
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                          {drug.indications}
                        </p>
                      </div>

                      {/* Caution Note */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700 block text-[11px]">
                          Prescribing Caution:
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {drug.cautions}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action: Links directly to dedicated detail page */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 truncate max-w-[170px]">
                        {drug.whoTarget.split("(")[0]}
                      </span>
                      <Link
                        href={`/guidelines/${drug.id}`}
                        className="inline-flex items-center text-xs font-semibold text-[#0D607B] hover:text-[#09475c] hover:bg-[#0D607B]/5 h-8 px-2.5 rounded-md transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredAwareDrugs.length === 0 && (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
                No antibiotics matched your active search or category filter.
              </div>
            )}
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 2: ICMR Standard Treatment Guidelines                */}
          {/* ======================================================== */}
          <TabsContent value="icmr" className="space-y-5">
            {/* Overview Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#0D607B] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block text-sm">
                  ICMR Outpatient Standard Treatment Guidelines (STG)
                </span>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Evidence-based clinical guidelines recommended by the Indian Council of Medical
                  Research. Prioritizes syndrome-first empirical management and restricts broad-spectrum
                  escalation in OPD care.
                </p>
              </div>
            </div>

            {/* Protocols Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredIcmrGuidelines.map((stg) => (
                <Card
                  key={stg.id}
                  className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="font-bold text-base text-slate-900">
                          {stg.syndrome}
                        </h2>
                        <span className="text-[11px] font-mono text-slate-400 font-semibold block mt-0.5">
                          {stg.code}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold shrink-0"
                      >
                        ICMR Standard
                      </Badge>
                    </div>

                    {/* First-Line Protocol Box */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recommended First-Line Protocol</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-950">
                        {stg.firstLineTherapy}
                      </p>
                      <div className="text-xs text-emerald-800 pt-1 flex items-center gap-3 flex-wrap">
                        <span>
                          <strong>Dose:</strong> {stg.firstLineDose}
                        </span>
                        <span>
                          <strong>Duration:</strong> {stg.durationDays}
                        </span>
                      </div>
                    </div>

                    {/* Target Pathogens */}
                    <div className="text-xs space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Common Pathogens
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {stg.targetPathogens}
                      </p>
                    </div>

                    {/* Red Flag Warning */}
                    <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                      <span className="font-semibold block text-[11px]">
                        Clinical Red Flags &amp; Inappropriate Uses:
                      </span>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed line-clamp-2">
                        {stg.redFlagsAndContraindications}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Links directly to dedicated detail page */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {stg.icmrReference}
                    </span>
                    <Link
                      href={`/guidelines/${stg.id}`}
                      className="inline-flex items-center text-xs font-semibold text-[#0D607B] hover:text-[#09475c] hover:bg-[#0D607B]/5 h-8 px-2.5 rounded-md transition-colors"
                    >
                      <span>View Full Protocol</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {filteredIcmrGuidelines.length === 0 && (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
                No treatment protocols matched your search query.
              </div>
            )}
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 3: CDSCO Banned Fixed-Dose Combinations              */}
          {/* ======================================================== */}
          <TabsContent value="fdc" className="space-y-5">
            {/* Statutory Notice Banner */}
            <div className="bg-red-50/60 p-4 rounded-xl border border-red-200 text-xs text-red-900 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-900 block text-sm">
                  Prohibited Combinations (Drugs &amp; Cosmetics Act, Sec 26A)
                </span>
                <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                  The Central Drugs Standard Control Organisation (CDSCO) has legally banned the
                  manufacture and outpatient prescription of irrational fixed-dose antimicrobial
                  combinations. Prescriptions containing these combinations are flagged immediately.
                </p>
              </div>
            </div>

            {/* Banned FDCs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredBannedFdcs.map((fdc) => (
                <Card
                  key={fdc.id}
                  className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-base text-slate-900">
                            {fdc.combination}
                          </h2>
                          <Badge
                            variant="destructive"
                            className="text-[10px] uppercase font-bold px-2 py-0.5"
                          >
                            Prohibited
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {fdc.gazetteNumber}
                        </span>
                      </div>
                    </div>

                    {/* Rationale for Prohibition */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Reason for Ban
                      </span>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {fdc.clinicalRationale}
                      </p>
                    </div>

                    {/* Sanctioned Alternative (Highlight) */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recommended Safe Alternative</span>
                      </div>
                      <p className="text-emerald-950 font-medium leading-relaxed pt-0.5">
                        {fdc.sanctionedAlternative}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Links directly to dedicated detail page */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 truncate">
                      {fdc.effectiveDate}
                    </span>
                    <Link
                      href={`/guidelines/${fdc.id}`}
                      className="inline-flex items-center text-xs font-semibold text-[#0D607B] hover:text-[#09475c] hover:bg-[#0D607B]/5 h-8 px-2.5 rounded-md transition-colors"
                    >
                      <span>Full Directive</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {filteredBannedFdcs.length === 0 && (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
                No banned drug combinations matched your search query.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
