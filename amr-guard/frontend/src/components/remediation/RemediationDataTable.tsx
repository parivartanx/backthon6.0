// [SOLID: SRP & Open-Closed] Modern High-Density Clinical Remediation Data Table
// Supports interactive row expansion, 1-click clinical switch/retain, column sorting, and view switching.
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PrescriptionCase } from "@/types/prescription";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  Sparkles,
  Info,
  Clock,
  ArrowUpDown
} from "lucide-react";
import { SwitchMedicineDialog } from "./SwitchMedicineDialog";

interface RemediationDataTableProps {
  cases: PrescriptionCase[];
  onAcceptAlternative: (c: PrescriptionCase, confirmedDays?: number) => void;
  onOpenRetain: (c: PrescriptionCase) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterTab: "ACTIONABLE" | "BLOCKED" | "FLAGGED" | "RESOLVED" | "ALL";
  onFilterTabChange: (tab: "ACTIONABLE" | "BLOCKED" | "FLAGGED" | "RESOLVED" | "ALL") => void;
  stats: {
    actionable: number;
    blocked: number;
    flagged: number;
    resolved: number;
    total: number;
  };
}

export function RemediationDataTable({
  cases,
  onAcceptAlternative,
  onOpenRetain,
  searchQuery,
  onSearchChange,
  filterTab,
  onFilterTabChange,
  stats,
}: RemediationDataTableProps) {
  // Expanded rows state (Set of case IDs)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Switch Medication Confirmation Dialog State
  const [switchTargetCase, setSwitchTargetCase] = useState<PrescriptionCase | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<"id" | "patient" | "status" | "score">("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // View mode: "table" or "card"
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Toggle row expansion
  const toggleRowExpansion = (caseId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  // Expand all / Collapse all
  const toggleExpandAll = () => {
    if (expandedRowIds.size === cases.length) {
      setExpandedRowIds(new Set());
    } else {
      setExpandedRowIds(new Set(cases.map((c) => c.id)));
    }
  };

  // Sort toggle handler
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sorted cases
  const sortedCases = useMemo(() => {
    return [...cases].sort((a, b) => {
      let comparison = 0;
      if (sortField === "id") {
        comparison = a.id.localeCompare(b.id);
      } else if (sortField === "patient") {
        const nameA = a.patient.patientName || "";
        const nameB = b.patient.patientName || "";
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === "status") {
        const statusA = a.clinicalOverride ? "RETAINED" : a.auditResult?.status || "APPROVED";
        const statusB = b.clinicalOverride ? "RETAINED" : b.auditResult?.status || "APPROVED";
        comparison = statusA.localeCompare(statusB);
      } else if (sortField === "score") {
        const scoreA = a.auditResult?.score ?? 0;
        const scoreB = b.auditResult?.score ?? 0;
        comparison = scoreA - scoreB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [cases, sortField, sortDirection]);

  // Paginated cases
  const totalPages = Math.max(1, Math.ceil(sortedCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCases.slice(start, start + pageSize);
  }, [sortedCases, currentPage, pageSize]);

  return (
    <div className="space-y-3.5">
      {/* Modern Table Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by Patient, Case ID, diagnosis, or medicine..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-8 text-xs bg-slate-50/70 border-slate-200 focus-visible:bg-white rounded-lg"
            />
          </div>

          {/* View Toggles & Bulk Expand */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {cases.length > 0 && viewMode === "table" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleExpandAll}
                className="h-8 text-[11px] px-2.5 text-slate-600 border-slate-200 hover:bg-slate-50 gap-1 rounded-lg"
              >
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                <span>{expandedRowIds.size === cases.length ? "Collapse All" : "Expand All"}</span>
              </Button>
            )}

            {/* View Mode Toggle: Table vs Cards */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-[#0D607B] shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Switch to Modern Data Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                  viewMode === "card"
                    ? "bg-white text-[#0D607B] shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Switch to Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-400 text-xs mr-1 shrink-0">
            <Filter className="w-3 h-3" />
            <span className="text-[11px] font-medium hidden sm:inline">Filter:</span>
          </div>

          {[
            { label: `All Actionable (${stats.actionable})`, value: "ACTIONABLE" },
            { label: `Critical Blocked (${stats.blocked})`, value: "BLOCKED" },
            { label: `Needs Review (${stats.flagged})`, value: "FLAGGED" },
            { label: `Resolved (${stats.resolved})`, value: "RESOLVED" },
            { label: `All (${stats.total})`, value: "ALL" },
          ].map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant={filterTab === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onFilterTabChange(tab.value as typeof filterTab);
                setCurrentPage(1);
              }}
              className={`h-7 text-[11px] px-2.5 rounded-lg shrink-0 ${
                filterTab === tab.value
                  ? "bg-[#0D607B] hover:bg-[#09475c] text-white font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Table View vs Card View */}
      {cases.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Prescriptions Require Remediation</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All prescriptions in this view have complied with ICMR guidelines or already received documented physician resolution.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onFilterTabChange("ALL")}
            className="text-xs text-[#0D607B] border-[#C9E9EB]"
          >
            View All Clinic Records
          </Button>
        </div>
      ) : viewMode === "table" ? (
        /* MODERN DATA TABLE VIEW */
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8 px-2 text-center"></TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-slate-900 select-none py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Case &amp; Patient</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Diagnosis / Syndrome
                  </TableHead>
                  <TableHead className="py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Current Prescribed
                  </TableHead>
                  <TableHead className="py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Guideline Alternative
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-slate-900 select-none py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Triage Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider pr-4">
                    Clinical Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCases.map((c) => {
                  const audit = c.auditResult;
                  const status = audit?.status || "APPROVED";
                  const isBlocked = status === "BLOCKED";
                  const isFlagged = status === "FLAGGED";
                  const isRetained = Boolean(c.clinicalOverride);
                  const isExpanded = expandedRowIds.has(c.id);
                  const flags = audit?.flags || [];
                  const mainFlag = flags[0];
                  const remediationOpt = audit?.remediation_options?.[0];
                  const primaryMed = c.medicines[0];
                  const suggestedAlternative = remediationOpt?.suggested_drug || "Amoxicillin 250mg";
                  const suggestedDays = remediationOpt?.suggested_duration_days || 5;

                  return (
                    <React.Fragment key={c.id}>
                      {/* Primary Table Row */}
                      <TableRow
                        className={`transition-colors cursor-pointer border-b border-slate-100 ${
                          isExpanded
                            ? "bg-[#F1F8FC]/60 hover:bg-[#F1F8FC]/80"
                            : "hover:bg-slate-50/70"
                        }`}
                        onClick={() => toggleRowExpansion(c.id)}
                      >
                        {/* Expand Caret */}
                        <TableCell className="w-8 px-2 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#0D607B] mx-auto" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 mx-auto" />
                          )}
                        </TableCell>

                        {/* Case & Patient Column */}
                        <TableCell className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#0D607B] bg-[#F1F8FC] px-1.5 py-0.5 rounded border border-[#C9E9EB]">
                              {c.id}
                            </span>
                            <div>
                              <span className="font-semibold text-xs text-slate-900 block leading-tight">
                                {c.patient.patientName || "Outpatient"}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {c.patient.age ? `${c.patient.age}y` : "Age N/A"} • {c.patient.sex || "Sex N/A"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Diagnosis / Syndrome Column */}
                        <TableCell className="py-2.5 pr-2">
                          <div>
                            <span className="text-xs font-medium text-slate-800 block leading-tight truncate max-w-[170px]" title={c.patient.suspectedDiagnosis || c.patient.symptoms}>
                              {c.patient.suspectedDiagnosis || c.patient.symptoms || "General OPD"}
                            </span>
                            {c.patient.canonical_syndrome ? (
                              <span className="inline-block text-[10px] text-[#0D607B] bg-[#F1F8FC] px-1.5 py-0.2 rounded mt-0.5 border border-[#C9E9EB]/60 truncate max-w-[170px]">
                                {c.patient.canonical_syndrome}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Clinical syndrome pending</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Current Prescribed Column */}
                        <TableCell className="py-2.5 pr-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[160px]" title={primaryMed ? `${primaryMed.brandName} (${primaryMed.genericName})` : "Prescribed Medication"}>
                                {primaryMed ? primaryMed.brandName || primaryMed.genericName : "Prescribed Medication"}
                              </span>
                              {primaryMed?.aware_tier && (
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 font-medium ${
                                  primaryMed.aware_tier === "Reserve"
                                    ? "bg-rose-100 text-rose-800 border-rose-200"
                                    : primaryMed.aware_tier === "Watch"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                }`}>
                                  {primaryMed.aware_tier}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Course: <strong>{primaryMed?.duration || "5 days"}</strong> • {primaryMed?.frequency || "BD"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Guideline Alternative Column */}
                        <TableCell className="py-2.5 pr-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-emerald-950 leading-tight truncate max-w-[180px]" title={suggestedAlternative}>
                                {suggestedAlternative}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 font-semibold">
                                Access
                              </Badge>
                            </div>
                            <span className="text-[10px] text-emerald-700 block mt-0.5">
                              Target: <strong>{suggestedDays} days</strong> (ICMR First-Line)
                            </span>
                          </div>
                        </TableCell>

                        {/* Triage Status Column */}
                        <TableCell className="py-2.5 pr-2">
                          {isRetained ? (
                            <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5 font-semibold bg-amber-50 text-amber-800 border-amber-300 rounded-full">
                              <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Retained</span>
                            </Badge>
                          ) : isBlocked ? (
                            <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5 font-semibold bg-rose-50 text-rose-700 border-rose-300 rounded-full">
                              <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>High Risk</span>
                            </Badge>
                          ) : isFlagged ? (
                            <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5 font-semibold bg-amber-50 text-amber-800 border-amber-300 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Needs Review</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5 font-semibold bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-[#169781] shrink-0" />
                              <span>Safe</span>
                            </Badge>
                          )}
                        </TableCell>

                        {/* Clinical Actions Column */}
                        <TableCell className="py-2.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click Switch Button */}
                            {!isRetained && (isBlocked || isFlagged) && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setSwitchTargetCase(c)}
                                className="h-7 text-[11px] px-2.5 gap-1 bg-[#169781] hover:bg-[#117866] text-white font-semibold shadow-2xs rounded-lg"
                                title="Switch to Guideline Recommended Alternative (Requires Confirmation)"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Switch</span>
                              </Button>
                            )}

                            {/* Keep with Rationale Button */}
                            {!isRetained && (isBlocked || isFlagged) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenRetain(c)}
                                className="h-7 text-[11px] px-2 gap-1 text-amber-800 border-amber-300 hover:bg-amber-50 rounded-lg"
                                title="Keep Current with Documented Clinical Rationale"
                              >
                                <FileText className="w-3 h-3 text-amber-600" />
                                <span className="hidden sm:inline">Keep</span>
                              </Button>
                            )}

                            {/* Detailed Review Link */}
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-[#0D607B] hover:bg-[#F1F8FC] rounded-lg"
                              title="Open Full Remediation Review Page"
                            >
                              <Link href={`/prescriptions/${encodeURIComponent(c.id)}/remediate`}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expandable Modern Detail Sub-Row */}
                      {isExpanded && (
                        <TableRow className="bg-[#F8FBFC] border-b border-slate-200 hover:bg-[#F8FBFC]">
                          <TableCell colSpan={7} className="p-3.5 sm:p-4">
                            <div className="space-y-2.5 max-w-5xl">
                              {/* Alert Banner / Reason */}
                              {mainFlag && !isRetained ? (
                                <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80 text-xs flex items-start gap-2">
                                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-rose-900 text-[11px]">
                                      Safety Alert: {mainFlag.rule_name}
                                    </div>
                                    <p className="text-[11px] text-rose-800 leading-snug">
                                      {mainFlag.rationale || "Prescription deviates from recommended first-line ICMR STG antimicrobial choice."}
                                    </p>
                                  </div>
                                </div>
                              ) : isRetained && c.clinicalOverride ? (
                                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-amber-900 text-[11px]">
                                      Doctor Clinical Justification Recorded:
                                    </div>
                                    <p className="text-[11px] text-amber-800 italic">
                                      &quot;{c.clinicalOverride.rationale}&quot;
                                    </p>
                                    <div className="text-[10px] text-amber-700">
                                      Recorded by {c.clinicalOverride.doctorName} • {new Date(c.clinicalOverride.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {/* Compact Side-by-Side Comparison Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {/* Left: Current Prescribed */}
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Current Prescribed Molecule
                                    </span>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-700 border-slate-300">
                                      {primaryMed?.aware_tier || "Watch"} Tier
                                    </Badge>
                                  </div>
                                  <div className="text-xs font-bold text-slate-900">
                                    {primaryMed ? `${primaryMed.brandName} (${primaryMed.genericName}) ${primaryMed.dose || ""}` : "Prescribed Medication"}
                                  </div>
                                  <div className="text-[11px] text-slate-600">
                                    Course: <span className="font-semibold text-slate-800">{primaryMed?.duration || "5 days"}</span> • {primaryMed?.frequency || "Twice daily (BD)"}
                                  </div>
                                </div>

                                {/* Right: Guideline Alternative */}
                                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 shadow-2xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                      Recommended First-Line Option
                                    </span>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
                                      Access Choice
                                    </Badge>
                                  </div>
                                  <div className="text-xs font-bold text-emerald-950">
                                    {suggestedAlternative}
                                  </div>
                                  <div className="text-[11px] text-emerald-800">
                                    Target Course: <span className="font-semibold text-emerald-900">{suggestedDays} days</span> (ICMR STG Protocol)
                                  </div>
                                </div>
                              </div>

                              {/* Expand Sub-Row Action Footer */}
                              <div className="pt-1.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                                <span className="text-[11px] text-slate-500">
                                  Need detailed dosage titration or culture data?
                                </span>
                                <div className="flex items-center gap-2">
                                  {!isRetained && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onOpenRetain(c)}
                                      className="h-7 text-[11px] px-2.5 text-amber-800 border-amber-300 hover:bg-amber-50 gap-1 rounded-lg"
                                    >
                                      <FileText className="w-3 h-3 text-amber-600" />
                                      <span>Keep Current (Add Reason)</span>
                                    </Button>
                                  )}
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] px-2.5 text-[#0D607B] border-[#C9E9EB] hover:bg-[#F1F8FC] gap-1 rounded-lg"
                                  >
                                    <Link href={`/prescriptions/${encodeURIComponent(c.id)}/remediate`}>
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Detailed Review</span>
                                    </Link>
                                  </Button>
                                  {!isRetained && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => setSwitchTargetCase(c)}
                                      className="h-7 text-[11px] px-3 bg-[#169781] hover:bg-[#117866] text-white font-semibold gap-1 rounded-lg shadow-2xs"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Switch to Recommended Medicine</span>
                                      <ArrowRight className="w-3 h-3 ml-0.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-slate-400">
                • Showing {Math.min(sortedCases.length, (currentPage - 1) * pageSize + 1)}–{Math.min(sortedCases.length, currentPage * pageSize)} of {sortedCases.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 w-7 p-0 rounded-lg text-slate-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 w-7 p-0 rounded-lg text-slate-600"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW (Optional fallback) */
        <div className="space-y-3">
          {paginatedCases.map((c) => {
            const audit = c.auditResult;
            const status = audit?.status || "APPROVED";
            const isBlocked = status === "BLOCKED";
            const isFlagged = status === "FLAGGED";
            const isRetained = Boolean(c.clinicalOverride);
            const flags = audit?.flags || [];
            const mainFlag = flags[0];
            const remediationOpt = audit?.remediation_options?.[0];
            const primaryMed = c.medicines[0];
            const suggestedAlternative = remediationOpt?.suggested_drug || "Amoxicillin 250mg";
            const suggestedDays = remediationOpt?.suggested_duration_days || 5;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#169781]/40 transition-all p-4 shadow-2xs space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-[#0D607B] bg-[#F1F8FC] px-1.5 py-0.5 rounded border border-[#C9E9EB]">
                      {c.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {c.patient.patientName || "Outpatient"}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {c.patient.age ? `${c.patient.age}y` : "Age N/A"} {c.patient.sex}
                    </span>
                    <span className="text-xs text-slate-500">
                      • Diagnosis: <strong>{c.patient.suspectedDiagnosis || c.patient.symptoms || "OPD"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isRetained ? (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                        Retained
                      </Badge>
                    ) : isBlocked ? (
                      <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-300">
                        High Risk
                      </Badge>
                    ) : isFlagged ? (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                        Needs Review
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30">
                        Safe
                      </Badge>
                    )}
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-[#0D607B]">
                      <Link href={`/prescriptions/${encodeURIComponent(c.id)}/remediate`}>
                        Full Detail <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Current Prescribed</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {primaryMed ? `${primaryMed.brandName} (${primaryMed.genericName})` : "Prescribed Medicine"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Course: {primaryMed?.duration || "5 days"}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Recommended First-Line</span>
                    <div className="font-bold text-emerald-950 mt-0.5">{suggestedAlternative}</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">Target: {suggestedDays} days (ICMR STG)</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  {!isRetained && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenRetain(c)}
                      className="h-7 text-xs text-amber-800 border-amber-300"
                    >
                      Keep Current
                    </Button>
                  )}
                  {!isRetained && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSwitchTargetCase(c)}
                      className="h-7 text-xs bg-[#169781] hover:bg-[#117866] text-white font-semibold shadow-2xs"
                    >
                      Switch to Recommended
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Switch Medication Confirmation Dialog */}
      {switchTargetCase && (() => {
        const primaryMed = switchTargetCase.medicines[0];
        const remediationOpt = switchTargetCase.auditResult?.remediation_options?.[0];
        const mainFlag = switchTargetCase.auditResult?.flags?.[0];
        const suggestedDrug = remediationOpt?.suggested_drug || "Amoxicillin 250mg";
        const suggestedDays = remediationOpt?.suggested_duration_days || 5;

        return (
          <SwitchMedicineDialog
            isOpen={Boolean(switchTargetCase)}
            onClose={() => setSwitchTargetCase(null)}
            onConfirm={(confirmedDays) => {
              onAcceptAlternative(switchTargetCase, confirmedDays);
              setSwitchTargetCase(null);
            }}
            caseId={switchTargetCase.id}
            patientName={switchTargetCase.patient.patientName}
            patientAge={switchTargetCase.patient.age}
            patientSex={switchTargetCase.patient.sex}
            diagnosis={switchTargetCase.patient.suspectedDiagnosis || switchTargetCase.patient.symptoms}
            currentMedicine={{
              name: primaryMed ? `${primaryMed.brandName} (${primaryMed.genericName})` : "Prescribed Molecule",
              dose: primaryMed?.dose,
              duration: primaryMed?.duration || "5 days",
              frequency: primaryMed?.frequency || "BD",
              tier: primaryMed?.aware_tier ? `${primaryMed.aware_tier} Tier` : "Watch Tier",
              reasonFlagged: mainFlag?.rationale || mainFlag?.rule_name || "Safety alert: Irrational antimicrobial combination.",
            }}
            targetMedicine={{
              name: suggestedDrug,
              dose: "250mg",
              duration: `${suggestedDays} days`,
              durationDays: suggestedDays,
              frequency: "Twice daily (BD)",
              tier: "Access (Safe Choice)",
              clinicalBenefit: "First-line ICMR STG recommendation with lowest resistance selection pressure.",
            }}
          />
        );
      })()}
    </div>
  );
}
