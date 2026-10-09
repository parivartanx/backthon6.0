"use client";

import { useState } from "react";
import { 
  Menu, 
  HelpCircle, 
  Activity, 
  CheckCircle2, 
  FileText, 
  ShieldCheck 
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";

interface AppHeaderProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  onOpenMobile?: () => void;
}

export function AppHeader({ title, breadcrumbs, onOpenMobile }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {onOpenMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onOpenMobile}
              className="md:hidden text-slate-500 hover:text-slate-800"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Breadcrumb or Title */}
          <div>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="flex items-center text-xs text-slate-500 space-x-1.5" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.label} className="flex items-center">
                    {idx > 0 && <span className="mx-1.5 text-slate-300">/</span>}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-[#0D607B] transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-800">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            ) : (
              <h1 className="text-base font-bold text-[#0D607B] tracking-tight">
                {title || "Doctor Dashboard"}
              </h1>
            )}
          </div>
        </div>

        {/* Header Utilities & Environment */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 px-2.5 py-1 bg-[#E2FAD9] border-[#169781]/20 text-[11px] font-semibold text-[#0d5c36]">
            <Activity className="w-3.5 h-3.5 text-[#169781]" />
            <span>Demo Workspace</span>
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowHelpModal(true)}
            className="text-slate-400 hover:text-[#0D607B] rounded-full"
            title="Clinical Guidance & Help"
            aria-label="Clinical Guidance & Help"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          <Link
            href="/profile"
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#0D607B] py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
            title="View Clinician Profile & Settings"
          >
            <div className="w-6 h-6 rounded-full bg-[#169781] text-white flex items-center justify-center text-[10px] font-bold">
              {user?.avatarInitials || "AS"}
            </div>
            <span className="hidden md:inline font-medium text-slate-700">
              {user?.name ? user.name.split(",")[0] : "Dr. Sharma"}
            </span>
          </Link>
        </div>
      </header>

      {/* Clinical Guidance Dialog */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="sm:max-w-lg p-6 space-y-4">
          <DialogHeader className="border-b border-slate-100 pb-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB] flex items-center justify-center text-[#0D607B]">
                <ShieldCheck className="w-5 h-5 text-[#169781]" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-[#0D607B]">
                  AMR Sentinel Clinical Protocol
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-500">
                  Five-Tier Antimicrobial Stewardship & Verification Engine
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB]">
              <FileText className="w-4 h-4 text-[#0D607B] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">1. Intake:</strong> Upload scanned outpatient slip or paste clinical notes. Patient age, biological sex, case ID, and presenting symptoms are validated.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F1F8FC] border border-[#C9E9EB]">
              <CheckCircle2 className="w-4 h-4 text-[#169781] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">2. Verification:</strong> Review extracted medicine brand names, active generic molecules, strength, route, frequency, and duration.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#E2FAD9]/50 border border-[#169781]/20">
              <Activity className="w-4 h-4 text-[#0d5c36] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0d5c36]">3. Phase 2 Handoff:</strong> Confirming locks the case and saves verified parameters for the antimicrobial decision support engine.
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="text-xs font-semibold text-white bg-[#169781] hover:bg-[#117866]"
            >
              Close Guidance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
