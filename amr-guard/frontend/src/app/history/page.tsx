// [SOLID: SRP] User-Friendly Prescription Audit History
// Clean, mature, non-technical medical interface for clinicians and clinic staff
// Keeps table rows single-line and un-cluttered; full details accessible via View Details

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { PrescriptionCase } from "@/types/prescription";
import { 
  History, 
  Search, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  RefreshCw, 
  FileText, 
  CheckCircle2,
  Pill,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function formatPrescriptionDate(dateStr?: string): string {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recent";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
}

export default function AuditHistoryPage() {
  const { cases, fetchCases, isLoading } = usePrescriptionStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSort, setSelectedSort] = useState<"NEWEST" | "RISK_DESC">("NEWEST");
  const [quickViewCase, setQuickViewCase] = useState<PrescriptionCase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // [DRY] User-friendly metrics calculation
  const stats = useMemo(() => {
    const total = cases.length;
    const approved = cases.filter((c) => (c.auditResult?.status || "APPROVED") === "APPROVED").length;
    const flagged = cases.filter((c) => c.auditResult?.status === "FLAGGED").length;
    const blocked = cases.filter((c) => c.auditResult?.status === "BLOCKED").length;

    return { total, approved, flagged, blocked };
  }, [cases]);

  // Filter and sort cases dynamically
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        // Status filter
        if (statusFilter !== "ALL") {
          const auditStatus = c.auditResult?.status || "APPROVED";
          if (auditStatus !== statusFilter) return false;
        }

        // Search filter (Case ID, diagnosis, symptoms, or medicines)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = c.id.toLowerCase().includes(q);
          const matchesDiagnosis = (c.patient.suspectedDiagnosis || "").toLowerCase().includes(q);
          const matchesSymptoms = (c.patient.symptoms || "").toLowerCase().includes(q);
          const matchesMeds = c.medicines.some(
            (m) =>
              m.brandName.toLowerCase().includes(q) ||
              m.genericName.toLowerCase().includes(q)
          );
          return matchesId || matchesDiagnosis || matchesSymptoms || matchesMeds;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === "RISK_DESC") {
          const scoreA = a.auditResult?.score ?? 0;
          const scoreB = b.auditResult?.score ?? 0;
          return scoreB - scoreA;
        }
        return b.id.localeCompare(a.id);
      });
  }, [cases, statusFilter, searchQuery, selectedSort]);

  // [DRY] Derived Pagination Metrics
  const totalItems = filteredCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  // CSV Export utility
  const handleExportCsv = () => {
    const headers = [
      "Prescription ID",
      "Date",
      "Patient Name",
      "Patient Age",
      "Patient Sex",
      "Diagnosis",
      "Medicines Count",
      "Prescribed Medicines",
      "Safety Score",
      "Safety Status",
      "Safety Alerts Count"
    ];

    const rows = filteredCases.map((c) => [
      c.id,
      formatPrescriptionDate(c.createdAt),
      `"${c.patient.patientName || 'Outpatient'}"`,
      c.patient.age || "N/A",
      c.patient.sex,
      `"${c.patient.suspectedDiagnosis || 'General OPD'}"`,
      c.medicines.length,
      `"${c.medicines.map((m) => `${m.brandName} (${m.genericName})`).join("; ")}"`,
      (() => {
        const isBlk = c.auditResult?.status === "BLOCKED";
        const isFlg = c.auditResult?.status === "FLAGGED";
        const raw = c.auditResult?.score ?? 0;
        return isBlk ? 0 : isFlg ? Math.max(10, 100 - raw) : Math.max(80, 100 - raw);
      })(),
      c.auditResult?.status === "BLOCKED" 
        ? "High Risk (Blocked)" 
        : c.auditResult?.status === "FLAGGED" 
        ? "Needs Review" 
        : "Safe & Approved",
      c.auditResult?.flags?.length ?? 0
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Prescriptions_History_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell
      title="Prescription History"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Prescription History" },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B] shrink-0">
              <History className="w-5 h-5 text-[#169781]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0D607B] tracking-tight">
                  Prescription History
                </h1>
                <Badge variant="outline" className="text-[10px] bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 font-semibold">
                  All Records
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Past prescriptions checked against ICMR and WHO antibiotic safety guidelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs h-8 px-3 text-[#0D607B] border-slate-200 hover:bg-[#F1F8FC]"
            >
              <Download className="w-3.5 h-3.5 text-[#169781]" />
              <span>Download Excel / CSV</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchCases()}
              className="gap-1.5 text-xs h-8 px-3 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* 4 User-Friendly Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Prescriptions</span>
              <FileText className="w-4 h-4 text-[#0D607B]" />
            </div>
            <div className="text-2xl font-black text-[#0D607B] mt-1.5">
              {stats.total}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Prescriptions in this clinic
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Safe & Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1.5">
              {stats.approved}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Follow standard guidelines
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Needs Review</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1.5">
              {stats.flagged}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Minor warnings or dose adjustments
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">High Risk (Blocked)</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1.5">
              {stats.blocked}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Contraindications prevented
            </span>
          </Card>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by ID, patient, diagnosis, or medicine name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs border-slate-200 bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Friendly Status Filter */}
            <div className="w-44">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val || "ALL");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Safe & Approved</SelectItem>
                  <SelectItem value="FLAGGED">Needs Review</SelectItem>
                  <SelectItem value="BLOCKED">High Risk (Blocked)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="w-44">
              <Select
                value={selectedSort}
                onValueChange={(val) => {
                  setSelectedSort(val as "NEWEST" | "RISK_DESC");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="NEWEST">Most Recent First</SelectItem>
                  <SelectItem value="RISK_DESC">Highest Concern First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Clean, Non-Overflowing Single-Line Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-[140px]">Prescription ID</th>
                  <th className="py-3 px-4 w-[160px]">Patient</th>
                  <th className="py-3 px-4 w-[200px]">Diagnosis</th>
                  <th className="py-3 px-4 w-[210px]">Medicines</th>
                  <th className="py-3 px-4 w-[130px] text-center">Safety Score</th>
                  <th className="py-3 px-4 w-[160px]">Review Status</th>
                  <th className="py-3 px-4 w-[100px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      Loading prescriptions...
                    </td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No prescriptions matched your search or filter.
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map((c) => {
                    const status = c.auditResult?.status || "APPROVED";
                    const alertCount = c.auditResult?.flags?.length ?? 0;
                    const isBlocked = status === "BLOCKED";
                    const isFlagged = status === "FLAGGED";
                    const rawScore = c.auditResult?.score ?? (isBlocked ? 100 : isFlagged ? 50 : 15);
                    
                    // True Clinical Safety Score: 0/100 for Blocked, 85-100 for Approved
                    const safetyScore = isBlocked 
                      ? 0 
                      : isFlagged 
                      ? Math.max(10, Math.min(70, Math.round(100 - rawScore))) 
                      : Math.max(80, Math.min(100, Math.round(100 - rawScore)));

                    // Clean, non-overflowing medicine summary
                    const medCount = c.medicines.length;
                    const firstMed = c.medicines[0]?.brandName || c.medicines[0]?.genericName || "Unspecified";
                    const medSummary = medCount === 0
                      ? "None"
                      : medCount === 1
                      ? firstMed
                      : `${firstMed} +${medCount - 1} more`;

                    return (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-50/80 transition-colors h-14"
                      >
                        {/* 1. Prescription ID & Date */}
                        <td className="py-2.5 px-4 truncate">
                          <span className="font-mono font-bold text-[#0D607B] text-xs block truncate">
                            {c.id}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {formatPrescriptionDate(c.createdAt)}
                          </span>
                        </td>

                        {/* 2. Patient Profile */}
                        <td className="py-2.5 px-4 truncate">
                          <span 
                            className="font-bold text-slate-900 text-xs block truncate"
                            title={c.patient.patientName?.trim() || "Outpatient Patient"}
                          >
                            {c.patient.patientName?.trim() || "Outpatient Patient"}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {c.patient.age ? `${c.patient.age}y` : "Age N/A"} • {c.patient.sex || "Patient"}
                            {c.patient.pregnancyStatus && c.patient.pregnancyStatus !== "Not applicable"
                              ? ` • ${c.patient.pregnancyStatus}`
                              : c.patient.egfr
                              ? ` • eGFR: ${c.patient.egfr}`
                              : ""}
                          </span>
                        </td>

                        {/* 3. Diagnosis / Condition */}
                        <td className="py-2.5 px-4 truncate" title={c.patient.suspectedDiagnosis || c.patient.symptoms}>
                          <span className="font-medium text-slate-800 text-xs block truncate">
                            {c.patient.suspectedDiagnosis || c.patient.symptoms || "General OPD Consult"}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {c.patient.canonical_syndrome || c.patient.symptoms || "Clinical evaluation"}
                          </span>
                        </td>

                        {/* 4. Medicines Summary (Strict single line, no wrapping badges) */}
                        <td className="py-2.5 px-4 truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-medium text-slate-700 truncate" title={c.medicines.map(m => m.brandName || m.genericName).join(", ")}>
                              {medSummary}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-slate-50 text-slate-500 border-slate-200 shrink-0">
                              {medCount} {medCount === 1 ? "med" : "meds"}
                            </Badge>
                          </div>
                        </td>

                        {/* 5. Safety Score (Harmonious with status: 0 for Blocked, Green for Approved) */}
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center font-bold px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                              safetyScore >= 80
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : safetyScore >= 40
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {safetyScore} / 100
                          </span>
                        </td>

                        {/* 6. Friendly Review Status Badge */}
                        <td className="py-2.5 px-4 truncate">
                          {isBlocked ? (
                            <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-0.5 font-semibold bg-rose-50 text-rose-700 border-rose-300 rounded-full shadow-2xs">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>High Risk (Blocked)</span>
                            </Badge>
                          ) : isFlagged ? (
                            <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-0.5 bg-amber-50 text-amber-800 border-amber-300 rounded-full font-semibold shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Needs Review {alertCount > 0 ? `(${alertCount})` : ""}</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-0.5 bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 rounded-full font-semibold shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#169781] shrink-0" />
                              <span>Safe &amp; Approved</span>
                            </Badge>
                          )}
                        </td>

                        {/* 7. Action Button */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setQuickViewCase(c)}
                              className="h-7 px-2 text-xs text-slate-500 hover:text-[#0D607B] hover:bg-slate-100"
                              title="Quick Overview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="sr-only">Quick Preview</span>
                            </Button>

                            <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs text-[#0D607B] border-slate-200 hover:bg-[#F1F8FC]">
                              <Link href={`/prescriptions/${encodeURIComponent(c.id)}/verify`}>
                                <span>Details</span>
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with User-Friendly Pagination */}
          <div className="bg-slate-50/70 p-3 px-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span>
                Showing <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalItems}</strong> prescriptions
              </span>

              <div className="flex items-center gap-1.5 ml-0 sm:ml-4">
                <span className="text-[11px] text-slate-400">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-7 text-xs rounded border border-slate-200 bg-white px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#169781]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Number Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="h-7 px-2 text-xs border-slate-200 text-slate-600 disabled:opacity-40"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                  <span>Prev</span>
                </Button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      if (totalPages <= 5) return true;
                      return Math.abs(pageNum - safeCurrentPage) <= 1 || pageNum === 1 || pageNum === totalPages;
                    })
                    .map((pageNum, idx, visibleArr) => {
                      const prevPage = visibleArr[idx - 1];
                      const showEllipsis = prevPage && pageNum - prevPage > 1;

                      return (
                        <div key={pageNum} className="flex items-center gap-1">
                          {showEllipsis && <span className="text-slate-400 text-xs px-1">…</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-7 min-w-[28px] px-1.5 rounded text-xs font-semibold transition-colors ${
                              pageNum === safeCurrentPage
                                ? "bg-[#0D607B] text-white"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-7 px-2 text-xs border-slate-200 text-slate-600 disabled:opacity-40"
                  aria-label="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal for non-tech users */}
      <Dialog open={!!quickViewCase} onOpenChange={(open) => !open && setQuickViewCase(null)}>
        {quickViewCase && (
          <DialogContent className="sm:max-w-md p-5 space-y-4">
            <DialogHeader className="text-left border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-sm font-bold text-[#0D607B]">
                  Prescription Summary
                </DialogTitle>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {quickViewCase.id}
                </span>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Patient and medication details at a glance
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              {/* Patient */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <User className="w-3.5 h-3.5 text-[#169781]" />
                  <span>Patient Profile</span>
                </div>
                <p className="text-slate-800">
                  {quickViewCase.patient.age} years old • {quickViewCase.patient.sex}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Diagnosis: <strong>{quickViewCase.patient.suspectedDiagnosis || quickViewCase.patient.symptoms || "General OPD"}</strong>
                </p>
              </div>

              {/* Medicines List */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Pill className="w-3.5 h-3.5 text-[#0D607B]" />
                  <span>Prescribed Medicines ({quickViewCase.medicines.length})</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {quickViewCase.medicines.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                      <div>
                        <span className="font-semibold text-slate-800">{m.brandName || m.genericName}</span>
                        <span className="text-[10px] text-slate-400 block">{m.genericName} • {m.dose}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {m.duration || "5d"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Result */}
              {(() => {
                const qStatus = quickViewCase.auditResult?.status || "APPROVED";
                const qIsBlocked = qStatus === "BLOCKED";
                const qIsFlagged = qStatus === "FLAGGED";
                const qRaw = quickViewCase.auditResult?.score ?? 0;
                const qScore = qIsBlocked ? 0 : qIsFlagged ? Math.max(10, Math.min(70, Math.round(100 - qRaw))) : Math.max(80, Math.min(100, Math.round(100 - qRaw)));

                return (
                  <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Guideline Evaluation</span>
                      <span className="font-bold text-xs text-slate-800">
                        Safety Score: <span className={qScore >= 80 ? "text-emerald-700" : qScore >= 40 ? "text-amber-700" : "text-rose-700"}>{qScore}/100</span>
                      </span>
                    </div>
                    <div>
                      {qIsBlocked ? (
                        <Badge variant="outline" className="text-[11px] bg-rose-50 text-rose-700 border-rose-300 font-semibold gap-1 rounded-full">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>High Risk (Blocked)</span>
                        </Badge>
                      ) : qIsFlagged ? (
                        <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-800 border-amber-300 font-semibold gap-1 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Needs Review</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 font-semibold gap-1 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-[#169781]" />
                          <span>Safe &amp; Approved</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickViewCase(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button asChild size="sm" className="text-xs bg-[#169781] hover:bg-[#117866] text-white">
                <Link href={`/prescriptions/${encodeURIComponent(quickViewCase.id)}/verify`}>
                  <span>Open Full Audit & Print</span>
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}
