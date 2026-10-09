// [SOLID: SRP] Hospital Antimicrobial Stewardship Statistics Service
import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import { DashboardMetrics } from "@/types/prescription";

export interface BackendStatsResponse {
  total_audits: number;
  blocked_count: number;
  flagged_count: number;
  approved_count: number;
  adherence_rate_pct: number;
  average_risk_score: number;
  aware_distribution: {
    access_pct: number;
    watch_pct: number;
    reserve_pct: number;
    who_target_met: boolean;
  };
  top_violations: Array<{
    rule_id: string;
    rule_name: string;
    count: number;
    percentage: number;
  }>;
  surveillance_benchmarks?: Record<string, string>;
  latency_metrics?: {
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    min_latency_ms: number;
    max_latency_ms: number;
    sla_target_ms: number;
    sla_adherence_rate_pct: number;
  };
}

export async function fetchStewardshipStats(): Promise<DashboardMetrics> {
  const response = await apiClient.get<BackendStatsResponse>(ENDPOINTS.STATS);
  const data = response.data;

  return {
    prescriptionsProcessed: data.total_audits,
    awaitingVerification: data.flagged_count,
    auditsReady: data.approved_count,
    averageProcessingTimeMinutes: 1.4,
    criticalBlockedCases: data.blocked_count,
    stewardshipComplianceRate: Math.round(data.adherence_rate_pct),
    awareDistribution: data.aware_distribution,
    topViolations: data.top_violations,
  };
}
