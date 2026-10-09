"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  BookOpenText, 
  RotateCcw, 
  ClipboardList, 
  Stethoscope, 
  AlertTriangle, 
  Info 
} from "lucide-react";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  onCloseMobile?: () => void;
}

export function AppSidebar({ onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const { resetDemoData } = usePrescriptionStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [phase2InfoModal, setPhase2InfoModal] = useState<string | null>(null);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard" || pathname === "/",
    },
    {
      label: "New Prescription",
      href: "/prescriptions/new",
      icon: FilePlus2,
      active: pathname.startsWith("/prescriptions/new"),
    },
    {
      label: "Audit History",
      href: "#",
      icon: History,
      active: false,
      badge: "Phase 2",
      placeholder: true,
    },
    {
      label: "Guideline Library",
      href: "#",
      icon: BookOpenText,
      active: false,
      badge: "ICMR",
      placeholder: true,
    },
  ];

  const handleExecuteReset = async () => {
    setResetting(true);
    await resetDemoData();
    setResetting(false);
    setShowResetConfirm(false);
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            onClick={onCloseMobile}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#169781] rounded-xl p-1.5 transition-colors hover:bg-slate-50"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D607B] to-[#169781] p-0.5 shadow-xs transition-transform group-hover:scale-105 shrink-0 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/vector2.jpeg" 
                alt="AMR Sentinel DNA Helix" 
                className="w-full h-full object-cover rounded-[10px] brightness-105 contrast-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#0D607B]">AMR Sentinel</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#169781] animate-pulse" title="System Active" />
              </div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Clinical Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Workflows
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.placeholder) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setPhase2InfoModal(item.label)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.2 bg-slate-100 text-slate-500 border-none">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  item.active
                    ? "bg-[#F1F8FC] text-[#0D607B] font-semibold shadow-2xs border-l-4 border-[#169781]"
                    : "text-slate-600 hover:text-[#0D607B] hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      item.active ? "text-[#169781]" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          {/* Phase 1 Scope Card */}
          <div className="mt-6 mx-1 p-3.5 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#0D607B]">
              <ClipboardList className="w-3.5 h-3.5 text-[#169781]" />
              <span>Phase 1 Scope</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Prescription digitization, OCR preparation & clinical data verification.
            </p>
          </div>
        </nav>

        {/* User & Demo Controls */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 h-8 text-xs text-slate-500 hover:text-[#0D607B] hover:bg-slate-100"
            title="Reset local sample cases"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </Button>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <Avatar className="w-9 h-9 ring-2 ring-[#E2FAD9]">
              <AvatarFallback className="bg-[#169781] text-white font-bold text-xs">
                AS
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                Dr. Ananya Sharma
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-[#169781]" />
                <span>OPD Clinician</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-sm p-5 space-y-4">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-slate-800">
                  Reset Demo Cases?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  This will reload original synthetic outpatient OPD cases and recalculate demo dashboard statistics.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(false)}
              className="text-xs font-medium text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteReset}
              disabled={resetting}
              className="text-xs font-semibold text-white bg-[#0D607B] hover:bg-[#09475c]"
            >
              {resetting ? "Resetting..." : "Reset Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase 2 Feature Notice Modal */}
      <Dialog open={!!phase2InfoModal} onOpenChange={(open) => !open && setPhase2InfoModal(null)}>
        <DialogContent className="sm:max-w-md p-5 space-y-4">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B]">
                <Info className="w-4 h-4 text-[#169781]" />
              </div>
              <DialogTitle className="text-sm font-bold text-[#0D607B]">
                {phase2InfoModal} — Phase 2 Architecture
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              <strong>{phase2InfoModal}</strong> is part of the clinical decision-support pipeline in Phase 2. Verified prescriptions from Phase 1 will flow directly into the ICMR guideline engine and hospital EMR integration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              size="sm"
              onClick={() => setPhase2InfoModal(null)}
              className="text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866]"
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
