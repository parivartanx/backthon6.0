// [SOLID: SRP] Modern Animated Clinical Navigation Sidebar for AMR Sentinel
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
  Stethoscope, 
  AlertTriangle, 
  Activity,
  Cpu
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
      badge: "Intake",
    },
    {
      label: "Audit History",
      href: "/history",
      icon: History,
      active: pathname.startsWith("/history"),
      badge: "Log",
    },
    {
      label: "Guideline Library",
      href: "/guidelines",
      icon: BookOpenText,
      active: pathname.startsWith("/guidelines"),
      badge: "ICMR/WHO",
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
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-full select-none shadow-2xs">
        {/* Brand Header with Emblem */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            onClick={onCloseMobile}
            className="flex items-center gap-3 group focus:outline-none rounded-xl p-1.5 transition-all duration-200 hover:bg-slate-50"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D607B] to-[#169781] p-0.5 shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1 shrink-0 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/vector2.jpeg" 
                alt="AMR Sentinel Emblem" 
                className="w-full h-full object-cover rounded-[10px] brightness-105 contrast-110" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#0D607B] group-hover:text-[#169781] transition-colors">
                  AMR Sentinel
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#169781] animate-pulse" title="System Active" />
              </div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Clinical Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links with Micro-Animations */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Workflows
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out ${
                  item.active
                    ? "bg-[#F1F8FC] text-[#0D607B] font-semibold shadow-2xs border-l-4 border-[#169781] translate-x-1"
                    : "text-slate-600 hover:text-[#0D607B] hover:bg-slate-50 hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-lg transition-colors ${
                    item.active ? "bg-white text-[#169781] shadow-2xs" : "text-slate-400 group-hover:text-[#169781]"
                  }`}>
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-medium px-2 py-0.2 border-none transition-colors ${
                      item.active
                        ? "bg-[#E2FAD9] text-[#0d5c36]"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}

          {/* Modern Active Engine Radar Card (Replaces static Phase 1 Scope) */}
          <div className="mt-6 mx-1 p-3.5 rounded-2xl bg-gradient-to-br from-[#F1F8FC] to-white border border-[#C9E9EB] text-xs shadow-2xs space-y-2 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#0D607B]">
                <ShieldCheck className="w-4 h-4 text-[#169781]" />
                <span>5-Tier Guard Engine</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Deterministic rule enforcement across <strong>WHO AWaRe 2023</strong>, <strong>ICMR STGs</strong> & <strong>CDSCO Bans</strong>.
            </p>

            <div className="pt-1.5 border-t border-[#C9E9EB]/60 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-[#169781] font-semibold">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Zero-LLM Core</span>
              </span>
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                &lt;5ms Latency
              </span>
            </div>
          </div>
        </nav>

        {/* User & Demo Controls */}
        <div className="p-3 border-t border-slate-100 space-y-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 h-8 text-xs text-slate-500 hover:text-[#0D607B] hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset local sample cases"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </Button>

          {/* Doctor Profile Pill with Online Indicator */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all">
            <div className="relative">
              <Avatar className="w-9 h-9 ring-2 ring-[#E2FAD9]">
                <AvatarFallback className="bg-[#169781] text-white font-bold text-xs">
                  AS
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" title="Online" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                Dr. Ananya Sharma
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-[#169781]" />
                <span className="truncate">OPD Room 4 • Duty</span>
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
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={resetting}
              onClick={handleExecuteReset}
              className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {resetting ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
