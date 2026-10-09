// [SOLID: SRP] Recent Prescription Activity Table
// Clean, single-line rows with ZERO horizontal scrolling (fits 100% width naturally)
// Secondary/overflowing data moved to detail page (/prescriptions/[id]/verify)
// Configurable pagination: 5, 10, 15, 20 rows per page
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  User,
  Filter,
  FileText,
  Plus,
} from "lucide-react";

interface PrescriptionDataTableProps {
  data: PrescriptionCase[];
}

function formatDateSummary(dateStr?: string): string {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recent";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "Recent";
  }
}

export function PrescriptionDataTable({ data }: PrescriptionDataTableProps) {
  const router = useRouter();

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Pagination state: page sizes 5, 10, 15, 20
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B] mx-auto shadow-2xs">
          <FileText className="w-7 h-7 text-[#169781]" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm font-bold text-slate-800">No Prescriptions Checked Yet Today</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Prescriptions you create and evaluate with the clinical safety engine will appear here in real-time.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="gap-2 px-5 py-2 rounded-xl bg-[#169781] hover:bg-[#117866] text-white text-xs font-semibold shadow-xs"
        >
          <Link href="/prescriptions/new">
            <Plus className="w-3.5 h-3.5" />
            <span>New Prescription Intake</span>
          </Link>
        </Button>
      </div>
    );
  }

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Status filter
      if (statusFilter !== "ALL") {
        const auditStatus = item.auditResult?.status;
        if (statusFilter === "APPROVED" && auditStatus !== "APPROVED") return false;
        if (statusFilter === "FLAGGED" && auditStatus !== "FLAGGED") return false;
        if (statusFilter === "BLOCKED" && auditStatus !== "BLOCKED") return false;
        if (statusFilter === "Needs Verification" && item.workflowStatus !== "Needs Verification") return false;
        if (statusFilter === "Ready for Audit" && item.workflowStatus !== "Ready for Audit") return false;
      }

      // Search query filter (matches ID, patient name, diagnosis, symptoms, or medication brand/generic)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = item.id.toLowerCase().includes(q);
        const nameMatch = item.patient.patientName?.toLowerCase().includes(q);
        const diagMatch =
          item.patient.suspectedDiagnosis?.toLowerCase().includes(q) ||
          item.patient.symptoms?.toLowerCase().includes(q);
        const medMatch = item.medicines?.some(
          (m) =>
            m.brandName?.toLowerCase().includes(q) ||
            m.genericName?.toLowerCase().includes(q)
        );
        if (!idMatch && !nameMatch && !diagMatch && !medMatch) return false;
      }

      return true;
    });
  }, [data, statusFilter, searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val: string | null) => {
    if (val) {
      setPageSize(Number(val));
      setCurrentPage(1);
    }
  };

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by Patient name/ID, diagnosis, or medicine..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50/60 border-slate-200 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#169781]"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 text-slate-400 text-xs mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          {[
            { label: "All Cases", value: "ALL" },
            { label: "Safe & Approved", value: "APPROVED" },
            { label: "Needs Review", value: "FLAGGED" },
            { label: "High Risk", value: "BLOCKED" },
            { label: "Needs Verification", value: "Needs Verification" },
          ].map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant={statusFilter === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilterChange(tab.value)}
              className={`h-8 text-xs px-2.5 rounded-lg shrink-0 ${
                statusFilter === tab.value
                  ? "bg-[#0D607B] hover:bg-[#09475c] text-white font-medium"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Table: table-fixed ensures 100% fit with ZERO horizontal scroll */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <Table className="w-full table-fixed text-xs">
          <TableHeader className="bg-slate-50/70 border-b border-slate-200/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[28%] py-3 px-4 font-semibold text-slate-700">
                Patient &amp; Time
              </TableHead>
              <TableHead className="w-[26%] py-3 px-4 font-semibold text-slate-700">
                Diagnosis / Condition
              </TableHead>
              <TableHead className="w-[22%] py-3 px-4 font-semibold text-slate-700">
                Primary Antibiotic
              </TableHead>
              <TableHead className="w-[13%] py-3 px-4 font-semibold text-slate-700">
                Safety Status
              </TableHead>
              <TableHead className="w-[11%] py-3 px-4 font-semibold text-slate-700 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => {
                const auditStatus = item.auditResult?.status;
                const firstMed = item.medicines?.[0];
                const otherCount = (item.medicines?.length || 1) - 1;

                return (
                  <TableRow
                    key={item.id}
                    onClick={() =>
                      router.push(`/prescriptions/${encodeURIComponent(item.id)}/verify`)
                    }
                    className="cursor-pointer hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0"
                  >
                    {/* Column 1: Patient & Time */}
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#169781] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {item.patient.patientName || item.id}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.patient.patientName ? `${item.id} • ` : ""}
                            {item.patient.age ? `${item.patient.age}y` : "Age N/A"} •{" "}
                            {item.patient.sex || "Patient"} • {formatDateSummary(item.createdAt)}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 2: Diagnosis */}
                    <TableCell className="py-3 px-4">
                      <span
                        className="font-medium text-slate-800 block truncate"
                        title={item.patient.suspectedDiagnosis || item.patient.symptoms || "General OPD"}
                      >
                        {item.patient.suspectedDiagnosis || item.patient.symptoms || "General OPD"}
                      </span>
                    </TableCell>

                    {/* Column 3: Primary Antibiotic (Secondary meds in detail page) */}
                    <TableCell className="py-3 px-4">
                      <div className="text-slate-700 truncate font-medium">
                        {firstMed ? (
                          <span title={`${firstMed.brandName || firstMed.genericName} ${firstMed.strength || ""}`}>
                            {firstMed.brandName || firstMed.genericName}{" "}
                            <span className="text-slate-400 font-normal">
                              {firstMed.strength || ""}
                            </span>
                            {otherCount > 0 && (
                              <span
                                className="ml-1 text-[10px] text-[#0D607B] font-semibold"
                                title={`${otherCount} additional medication(s) viewable on detail page`}
                              >
                                +{otherCount}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">1 Medication</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 4: Safety Status */}
                    <TableCell className="py-3 px-4">
                      {auditStatus === "APPROVED" ? (
                        <Badge
                          variant="outline"
                          className="bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/30 gap-1 text-[10px] font-semibold py-0.5 px-2 rounded-full shadow-2xs"
                        >
                          <ShieldCheck className="w-3 h-3 text-[#169781] shrink-0" />
                          <span>Safe &amp; Approved</span>
                        </Badge>
                      ) : auditStatus === "BLOCKED" ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-300 gap-1 text-[10px] font-semibold py-0.5 px-2 rounded-full shadow-2xs"
                        >
                          <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>High Risk (Blocked)</span>
                        </Badge>
                      ) : auditStatus === "FLAGGED" ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-800 border-amber-300 gap-1 text-[10px] font-semibold py-0.5 px-2 rounded-full shadow-2xs"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Needs Review</span>
                        </Badge>
                      ) : item.workflowStatus === "Needs Verification" ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-800 border-amber-300 gap-1 text-[10px] font-semibold py-0.5 px-2"
                        >
                          <span>Needs Verification</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] font-medium py-0.5 px-2"
                        >
                          <span>Pending</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Column 5: Action (Direct link to detail page) */}
                    <TableCell className="py-3 px-4 text-right">
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-[#0D607B] hover:text-[#169781] hover:bg-[#F1F8FC] gap-1 font-semibold"
                      >
                        <Link
                          href={`/prescriptions/${encodeURIComponent(item.id)}/verify`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  No prescriptions found matching current filter or search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="bg-slate-50/50 border-t border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          {/* Row size selector & record counter */}
          <div className="flex items-center gap-3">
            <span>
              Showing{" "}
              <strong className="text-slate-800 font-semibold">
                {totalItems === 0 ? 0 : startIndex + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-800 font-semibold">{endIndex}</strong> of{" "}
              <strong className="text-slate-800 font-semibold">{totalItems}</strong>
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] text-slate-500">Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-300">
                  <SelectValue placeholder="5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Page navigation controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 mr-1">
              Page <strong className="text-slate-700">{safeCurrentPage}</strong> of{" "}
              <strong className="text-slate-700">{totalPages}</strong>
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="h-7 px-2 text-xs border-slate-300 text-slate-600 disabled:opacity-40"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              <span>Previous</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="h-7 px-2 text-xs border-slate-300 text-slate-600 disabled:opacity-40"
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
