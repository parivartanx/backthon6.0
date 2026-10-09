"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SummaryStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  badge?: string;
  accentColor?: string;
}

// [SOLID: SRP] Clinical summary metric widget built on shadcn/ui Card and Badge
export function SummaryStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge = "Live Data",
  accentColor = "#169781",
}: SummaryStatCardProps) {
  return (
    <Card className="relative overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow bg-white flex flex-col justify-between">
      {/* Top brand accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />

      <CardHeader className="p-5 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {title}
          </CardTitle>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0D607B]">
            {value}
          </div>
        </div>

        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
        <span className="text-slate-500">{subtitle}</span>
        {badge && (
          <Badge variant="outline" className="text-[10px] text-slate-400 bg-slate-50 font-normal">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
