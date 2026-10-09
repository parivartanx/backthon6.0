"""
Schemas for hospital antimicrobial stewardship dashboard and surveillance analytics.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AWaReDistribution(BaseModel):
    access_pct: float = Field(..., description="Percentage of Access group antimicrobials prescribed")
    watch_pct: float = Field(..., description="Percentage of Watch group antimicrobials prescribed")
    reserve_pct: float = Field(..., description="Percentage of Reserve group antimicrobials prescribed")
    who_target_met: bool = Field(..., description="True if Access group >= 60.0%")

class TopViolationStat(BaseModel):
    rule_id: str
    rule_name: str
    count: int
    percentage: float

class LatencyMetricsSummary(BaseModel):
    avg_latency_ms: float = Field(..., description="Mean execution latency in milliseconds")
    p50_latency_ms: float = Field(..., description="Median (50th percentile) latency in milliseconds")
    p95_latency_ms: float = Field(..., description="95th percentile latency in milliseconds")
    p99_latency_ms: float = Field(..., description="99th percentile latency in milliseconds")
    min_latency_ms: int = Field(..., description="Minimum recorded latency in milliseconds")
    max_latency_ms: int = Field(..., description="Maximum recorded latency in milliseconds")
    sla_target_ms: float = Field(5.0, description="Target SLA limit in milliseconds for deterministic verification")
    sla_adherence_rate_pct: float = Field(..., description="Percentage of audits meeting the SLA target")

class StatsResponse(BaseModel):
    total_audits: int = Field(..., description="Total prescriptions audited")
    blocked_count: int = Field(..., description="Hard blocked prescriptions (Tier 1)")
    flagged_count: int = Field(..., description="Flagged prescriptions requiring stewardship review")
    approved_count: int = Field(..., description="Compliant first-line prescriptions")
    adherence_rate_pct: float = Field(..., description="Percentage of prescriptions fully approved")
    average_risk_score: float = Field(..., description="Average AMR Risk Score across audited cohort")
    aware_distribution: AWaReDistribution = Field(..., description="WHO AWaRe spectrum utilization ratios")
    top_violations: List[TopViolationStat] = Field(default_factory=list, description="Most frequent clinical safety and stewardship violations")
    surveillance_benchmarks: Dict[str, Any] = Field(default_factory=dict, description="ICMR-AMRSN national pathogen resistance benchmarks")
    latency_metrics: Optional[LatencyMetricsSummary] = Field(default=None, description="Clinical telemetry execution latency metrics and SLA adherence")
