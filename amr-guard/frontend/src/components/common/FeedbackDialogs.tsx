// [SOLID: SRP] Global Error Dialog and Success Dialog Components
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, RotateCcw, Lightbulb } from "lucide-react";
import { useFeedbackStore } from "@/store/useFeedbackStore";

export function FeedbackDialogs() {
  const { errorDialog, successDialog, closeError, closeSuccess } =
    useFeedbackStore();

  return (
    <>
      {/* 1. Global Error Dialog */}
      <Dialog
        open={errorDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) closeError();
        }}
      >
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-md border-rose-200/90 shadow-xl bg-white p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <DialogHeader className="text-left p-0">
                <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
                  {errorDialog.title || "Clinical Notice"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {errorDialog.message}
                </DialogDescription>
              </DialogHeader>

              {/* Actionable Hint / Suggestion */}
              {errorDialog.hint && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{errorDialog.hint}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-5 sm:justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeError}
              className="text-xs font-medium rounded-xl border-slate-200"
            >
              Dismiss
            </Button>
            {errorDialog.canRetry && errorDialog.onRetry && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const retry = errorDialog.onRetry;
                  closeError();
                  retry?.();
                }}
                className="gap-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Global Success Dialog */}
      <Dialog
        open={successDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) closeSuccess();
        }}
      >
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-md border-emerald-200/90 shadow-xl bg-white p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E2FAD9] border border-emerald-200 flex items-center justify-center text-[#0d5c36] shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <DialogHeader className="text-left p-0">
                <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
                  {successDialog.title || "Operation Successful"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {successDialog.message}
                </DialogDescription>
              </DialogHeader>

              {successDialog.details && (
                <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 font-mono">
                  {successDialog.details}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-5 sm:justify-end gap-2 border-t border-slate-100 pt-3">
            {successDialog.secondaryLabel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const secAction = successDialog.onSecondary;
                  closeSuccess();
                  secAction?.();
                }}
                className="text-xs font-medium rounded-xl border-slate-200"
              >
                {successDialog.secondaryLabel}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const primaryAction = successDialog.onPrimary;
                closeSuccess();
                primaryAction?.();
              }}
              className="px-5 text-xs font-semibold rounded-xl bg-[#169781] hover:bg-[#117866] text-white shadow-xs"
            >
              {successDialog.primaryLabel || "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
