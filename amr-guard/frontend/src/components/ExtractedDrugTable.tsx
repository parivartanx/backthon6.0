// [SOLID: SRP] ExtractedDrugTable for AMR Sentinel with WHO AWaRe categorization
"use client";

import React from "react";
import { MedicineEntry } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";
import { Pill, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDrugClassificationBadge } from "@/components/RemediationPanel";

interface ExtractedDrugTableProps {
  medicines: MedicineEntry[];
}

export function ExtractedDrugTable({ medicines }: ExtractedDrugTableProps) {
  if (!medicines || medicines.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
        No medication entities detected.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-[#169781]" />
          <span className="text-xs font-bold text-[#0D607B] uppercase tracking-wide">
            Medication Regimen & Therapeutic / AWaRe Classification
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600">
          {medicines.length} {medicines.length === 1 ? "Agent" : "Agents"}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="text-[11px] font-bold text-slate-500">Medication / Molecule</TableHead>
            <TableHead className="text-[11px] font-bold text-slate-500">Therapeutic / AWaRe</TableHead>
            <TableHead className="text-[11px] font-bold text-slate-500">Strength & Dose</TableHead>
            <TableHead className="text-[11px] font-bold text-slate-500">Frequency</TableHead>
            <TableHead className="text-[11px] font-bold text-slate-500">Duration</TableHead>
            <TableHead className="text-[11px] font-bold text-slate-500 text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medicines.map((med) => {
            const isFdc = med.is_fdc;
            const badgeConfig = getDrugClassificationBadge(med);

            return (
              <TableRow key={med.id} className="hover:bg-slate-50/60 transition-colors">
                <TableCell className="py-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span>{med.brandName}</span>
                      {isFdc && (
                        <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700 border-red-300 font-bold px-1.5 py-0">
                          Banned FDC
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {med.genericName || "Generic Molecule N/A"}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${badgeConfig.className}`}>
                    {badgeConfig.label}
                  </Badge>
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-700">
                  <span>{med.strength || med.dose || "Standard"}</span>
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-700">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                    {med.frequency || "OD"}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-800">
                    {med.duration || "5 days"}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-right">
                  {med.verificationStatus === "Verified" ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      <span>Review</span>
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
