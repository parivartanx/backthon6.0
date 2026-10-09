"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PrescriptionCase, PrescriptionWorkflowStatus } from "@/types/prescription";
import { DataTable } from "@/components/ui/data-table";
import { 
  FileText, 
  Image as ImageIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Pill,
  ShieldCheck,
  User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PrescriptionDataTableProps {
  data: PrescriptionCase[];
}

export function PrescriptionDataTable({ data }: PrescriptionDataTableProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const filteredData = useMemo(() => {
    if (selectedStatus === "ALL") return data;
    return data.filter((item) => item.workflowStatus === selectedStatus);
  }, [data, selectedStatus]);

  const columns = useMemo<ColumnDef<PrescriptionCase>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Patient / Case ID",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B] shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-xs">
                  {item.id}
                </div>
                <div className="text-[11px] text-slate-400">
                  {item.patient.age ? `${item.patient.age}y` : "Age N/A"} • {item.patient.sex}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "sourceType",
        header: "Prescription Source",
        cell: ({ row }) => {
          const type = row.original.sourceType;
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              {type === "upload" ? (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-[#0D607B]" />
                  <span>Document Scan</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-[#169781]" />
                  <span>Manual Notes</span>
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "medicines",
        header: "Medicines Detected",
        cell: ({ row }) => {
          const meds = row.original.medicines || [];
          const count = meds.length;
          const names = meds.slice(0, 2).map((m) => m.brandName).join(", ");
          return (
            <div className="text-xs">
              <div className="flex items-center gap-1 font-medium text-slate-700">
                <Pill className="w-3 h-3 text-[#169781]" />
                <span>{count} {count === 1 ? "medication" : "medications"}</span>
              </div>
              {count > 0 && (
                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  {names} {count > 2 ? `+${count - 2} more` : ""}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => {
          const dateStr = row.original.updatedAt || row.original.createdAt;
          let formatted = "Recently";
          try {
            const d = new Date(dateStr);
            formatted = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          } catch {
            formatted = "Just now";
          }
          return (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatted}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "workflowStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.workflowStatus as PrescriptionWorkflowStatus;
          switch (status) {
            case "Ready for Audit":
              return (
                <Badge variant="outline" className="gap-1 bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/20">
                  <ShieldCheck className="w-3 h-3 text-[#169781]" />
                  <span>Ready for Audit</span>
                </Badge>
              );
            case "Needs Verification":
              return (
                <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-800 border-amber-300/60">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Needs Verification</span>
                </Badge>
              );
            case "Extraction Complete":
              return (
                <Badge variant="outline" className="gap-1 bg-[#C9E9EB]/60 text-[#0D607B] border-[#0D607B]/20">
                  <CheckCircle2 className="w-3 h-3 text-[#0D607B]" />
                  <span>Extraction Complete</span>
                </Badge>
              );
            default:
              return (
                <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-600">
                  <span>Draft</span>
                </Badge>
              );
          }
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Action</span>,
        cell: ({ row }) => {
          const item = row.original;
          const isReady = item.workflowStatus === "Ready for Audit";
          return (
            <div className="flex items-center justify-end">
              <Button
                asChild
                size="sm"
                variant={isReady ? "outline" : "default"}
                className={`gap-1 text-xs h-8 ${
                  isReady
                    ? "text-[#0D607B] bg-[#F1F8FC] hover:bg-[#C9E9EB]/40 border-[#C9E9EB]"
                    : "text-white bg-[#169781] hover:bg-[#117866]"
                }`}
              >
                <Link
                  href={`/prescriptions/${encodeURIComponent(item.id)}/verify`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{isReady ? "Review Case" : "Verify Details"}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const statuses = [
    { label: "All Cases", value: "ALL", count: data.length },
    {
      label: "Needs Verification",
      value: "Needs Verification",
      count: data.filter((d) => d.workflowStatus === "Needs Verification").length,
    },
    {
      label: "Extraction Complete",
      value: "Extraction Complete",
      count: data.filter((d) => d.workflowStatus === "Extraction Complete").length,
    },
    {
      label: "Ready for Audit",
      value: "Ready for Audit",
      count: data.filter((d) => d.workflowStatus === "Ready for Audit").length,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statuses.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={selectedStatus === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus(tab.value)}
            className={`gap-1.5 text-xs h-8 ${
              selectedStatus === tab.value
                ? "bg-[#0D607B] hover:bg-[#09475c] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 h-4 border-none ${
                selectedStatus === tab.value
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Shadcn TanStack Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="id"
        searchPlaceholder="Filter by Case ID (e.g. CASE-2026)..."
        emptyMessage="No prescriptions matching current filter."
        pageSize={6}
        onRowClick={(item) => {
          router.push(`/prescriptions/${encodeURIComponent(item.id)}/verify`);
        }}
      />
    </div>
  );
}
