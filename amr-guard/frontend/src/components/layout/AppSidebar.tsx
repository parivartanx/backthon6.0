"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  History,
  BookOpenText,
  RotateCcw,
  Stethoscope,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";
import { useAuthStore } from "@/store/useAuthStore";
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
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  onCloseMobile?: () => void;
}

export function AppSidebar({ onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const { resetDemoData, activeCase, cases } = usePrescriptionStore();
  const user = useAuthStore((s) => s.user);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Target case for direct Remediation navigation from sidebar
  const targetCaseId =
    activeCase?.id ||
    cases.find(
      (c) =>
        c.auditResult?.status === "BLOCKED" ||
        c.auditResult?.status === "FLAGGED"
    )?.id ||
    cases[0]?.id ||
    "CASE-2026-1561";

  const blockedCount = cases.filter(
    (c) =>
      c.auditResult?.status === "BLOCKED" ||
      c.auditResult?.status === "FLAGGED"
  ).length;

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
      label: "Clinical Remediation",
      href: "/remediation",
      icon: ShieldAlert,
      badge: blockedCount > 0 ? `${blockedCount}` : undefined,
      active: pathname.startsWith("/remediation") || pathname.includes("/remediate"),
    },
    {
      label: "Prescription History",
      href: "/history",
      icon: History,
      active: pathname.startsWith("/history"),
    },
    {
      label: "Guideline Library",
      href: "/guidelines",
      icon: BookOpenText,
      active: pathname.startsWith("/guidelines"),
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
        <div className="h-16 px-4 border-b border-slate-100 flex items-center">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#0D607B]/30 rounded-lg p-1 transition-colors"
          >
            <div className="relative w-9 h-9 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vector2.jpeg"
                alt="AMR Sentinel"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#0D607B]">
                  AMR Sentinel
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  title="System Online"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                Antibiotic Safety Support
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active
                  ? "bg-[#0D607B]/10 text-[#0D607B] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${item.active
                    ? "text-[#0D607B]"
                    : "text-slate-400 group-hover:text-slate-600"
                    }`}
                />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Clinician Card & Reset Demo Action */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <Link
            href="/profile"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors group ${pathname === "/profile"
              ? "bg-[#0D607B]/5 border-[#0D607B]/30 ring-1 ring-[#0D607B]/20"
              : "bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
              }`}
            title="View Clinician Profile"
          >
            <Avatar className="w-9 h-9 shrink-0 ring-1 ring-slate-200">
              <AvatarFallback className="bg-[#0D607B] text-white font-semibold text-xs">
                {user?.avatarInitials || "AS"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#0D607B]">
                {user?.name || "Dr. Ananya Sharma"}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                <Stethoscope className="w-3 h-3 text-[#169781] shrink-0" />
                <span className="truncate">{user?.role || "OPD Clinician"}</span>
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </Link>

          {/* <Button
            type="button"
            variant="ghost"
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-1.5 h-8 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100/70"
            title="Reset sample data"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </Button> */}
        </div>
      </aside>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-sm p-5 space-y-4">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-slate-800">
                  Reset Demo Prescriptions?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  This will reload standard outpatient clinical cases and recalculate dashboard statistics.
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
    </>
  );
}
