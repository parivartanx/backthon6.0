// [SOLID: SRP & OCP] Shimmer Skeleton Loaders for Data Fetching & Details States
import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function ShimmerSkeleton({ className, ...props }: ShimmerSkeletonProps) {
  return (
    <div
      className={cn("animate-shimmer rounded-md bg-slate-200/80", className)}
      {...props}
    />
  );
}

/**
 * 4 Dashboard Metric Cards Shimmer Skeleton
 */
export function DashboardMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4 sm:p-5 border-slate-200/80 bg-white">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <ShimmerSkeleton className="h-3 w-28" />
              <ShimmerSkeleton className="h-7 w-16 rounded-md" />
              <ShimmerSkeleton className="h-2.5 w-36" />
            </div>
            <ShimmerSkeleton className="w-10 h-10 rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Surveillance Trends & Charts Shimmer Skeleton
 */
export function DashboardChartsSkeleton() {
  return (
    <Card className="p-6 border-slate-200/80 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <ShimmerSkeleton className="h-4 w-48" />
          <ShimmerSkeleton className="h-3 w-64" />
        </div>
        <ShimmerSkeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="space-y-3 lg:col-span-1">
          <ShimmerSkeleton className="h-3 w-32" />
          <ShimmerSkeleton className="h-10 w-full rounded-xl" />
          <ShimmerSkeleton className="h-10 w-full rounded-xl" />
          <ShimmerSkeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-2 flex items-center justify-center p-4">
          <ShimmerSkeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Recent Prescriptions Table Shimmer Skeleton
 */
export function DashboardTableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <ShimmerSkeleton className="h-4 w-40" />
        <ShimmerSkeleton className="h-8 w-48 rounded-lg" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <ShimmerSkeleton className="h-4 w-24 rounded-md" />
                <ShimmerSkeleton className="h-4 w-32" />
              </div>
              <ShimmerSkeleton className="h-3 w-48" />
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <ShimmerSkeleton className="h-6 w-20 rounded-full" />
              <ShimmerSkeleton className="h-6 w-16 rounded-full" />
            </div>
            <ShimmerSkeleton className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Prescription Form Inputs Shimmer Skeleton
 */
export function PrescriptionFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6 border-slate-200/80 bg-white space-y-4">
        <ShimmerSkeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ShimmerSkeleton className="h-10 w-full rounded-xl" />
          <ShimmerSkeleton className="h-10 w-full rounded-xl" />
          <ShimmerSkeleton className="h-10 w-full rounded-xl" />
          <ShimmerSkeleton className="h-10 w-full rounded-xl" />
        </div>
      </Card>
      <Card className="p-6 border-slate-200/80 bg-white space-y-3">
        <ShimmerSkeleton className="h-5 w-48" />
        <ShimmerSkeleton className="h-32 w-full rounded-xl" />
      </Card>
    </div>
  );
}
