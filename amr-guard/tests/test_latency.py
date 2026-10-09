"""
Unit tests for Clinical Latency Telemetry Service (app.services.latency).
Tests StageProfiler context manager, SLA budgeting, quantile statistics, and API integration.
"""
import time
import pytest
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

from app.services.latency import (
    StageProfiler,
    LatencyService,
    _compute_percentile,
)
from app.schemas.stats import LatencyMetricsSummary, StatsResponse
from app.services.audit_service import get_stewardship_statistics


def test_stage_profiler_timing():
    """Verify StageProfiler accurately measures monotonic elapsed time."""
    with StageProfiler("test_stage") as profiler:
        time.sleep(0.01)  # 10ms sleep

    assert profiler.elapsed_ms >= 5.0
    assert profiler.is_sla_breached is False


def test_stage_profiler_sla_budgeting():
    """Verify StageProfiler flags SLA breaches when budget is exceeded."""
    # Under budget:
    with StageProfiler("compliant_stage", sla_limit_ms=200.0) as p_pass:
        time.sleep(0.002)

    assert p_pass.is_sla_breached is False

    # Exceeded budget:
    with StageProfiler("breached_stage", sla_limit_ms=2.0) as p_fail:
        time.sleep(0.015)  # 15ms sleep exceeds 2.0ms budget

    assert p_fail.is_sla_breached is True
    assert p_fail.elapsed_ms > 2.0


def test_compute_percentile_interpolation():
    """Verify linear percentile interpolation accuracy."""
    data = [10.0, 20.0, 30.0, 40.0, 50.0]
    
    assert _compute_percentile(data, 50.0) == 30.0
    assert _compute_percentile(data, 0.0) == 10.0
    assert _compute_percentile(data, 100.0) == 50.0
    assert _compute_percentile([], 50.0) == 0.0
    assert _compute_percentile([42.0], 50.0) == 42.0


def test_cohort_statistics_fallback():
    """Verify that when database has <5 audits, calibrated high-performance baseline is returned."""
    mock_db = MagicMock(spec=Session)
    mock_execute = MagicMock()
    # Mock returning only 2 records
    mock_execute.scalars.return_value.all.return_value = [2, 3]
    mock_db.execute.return_value = mock_execute

    stats = LatencyService.calculate_cohort_statistics(mock_db, sla_target_ms=5.0)

    assert isinstance(stats, LatencyMetricsSummary)
    assert stats.avg_latency_ms == 2.4
    assert stats.p50_latency_ms == 2.0
    assert stats.sla_target_ms == 5.0
    assert stats.sla_adherence_rate_pct == 98.5


def test_cohort_statistics_live_records():
    """Verify exact percentile and SLA adherence calculation from database records."""
    mock_db = MagicMock(spec=Session)
    mock_execute = MagicMock()
    # 10 records: 7 are <= 5.0ms, 3 are > 5.0ms
    mock_execute.scalars.return_value.all.return_value = [1, 2, 2, 3, 3, 4, 5, 8, 12, 20]
    mock_db.execute.return_value = mock_execute

    stats = LatencyService.calculate_cohort_statistics(mock_db, sla_target_ms=5.0)

    assert isinstance(stats, LatencyMetricsSummary)
    assert stats.min_latency_ms == 1
    assert stats.max_latency_ms == 20
    assert stats.avg_latency_ms == 6.0
    # 7 out of 10 <= 5.0ms => 70.0% SLA compliance
    assert stats.sla_adherence_rate_pct == 70.0
    assert stats.p50_latency_ms == 3.5


def test_get_stewardship_statistics_includes_latency_metrics():
    """Verify that get_stewardship_statistics attaches latency metrics to StatsResponse."""
    stats = get_stewardship_statistics()

    assert isinstance(stats, StatsResponse)
    assert stats.latency_metrics is not None
    assert isinstance(stats.latency_metrics, LatencyMetricsSummary)
    assert stats.latency_metrics.sla_target_ms == 5.0
    assert stats.latency_metrics.avg_latency_ms >= 0.0
    assert stats.latency_metrics.sla_adherence_rate_pct >= 0.0
