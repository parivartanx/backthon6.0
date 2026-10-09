"""
Deterministic Scoring and Stewardship Triage Engine for AMR-Guard.
Applies the mathematically bounded Five-Tier verification penalty formula:
    AMR_Risk_Score = min(100, 0.4 * P_class + 0.2 * P_duration + 0.4 * P_indication)
Pure Python - zero LLM dependencies.
"""
import time
from typing import List, Optional
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.audit import AuditResult, RuleViolation, PenaltiesBreakdown
from app.engine.rule_registry import evaluate_all_rules
from app.engine.remediation import generate_remediations

def calculate_score(violations: List[RuleViolation]) -> tuple[float, str, str, PenaltiesBreakdown]:
    """
    Calculate the deterministic AMR Risk Score, status, and triage band.
    Returns (score, status, band, penalties_breakdown).
    """
    # 1. Tier 1 Hard Contraindication Check (Zero Tolerance)
    has_tier_1 = any(v.tier == 1 or v.severity == "BLOCKED" for v in violations)

    # Calculate penalty components
    class_penalties = [v.penalty_score for v in violations if v.penalty_type == "class"]
    dur_penalties = [v.penalty_score for v in violations if v.penalty_type == "duration"]
    ind_penalties = [v.penalty_score for v in violations if v.penalty_type == "indication"]

    p_class = min(100.0, sum(class_penalties)) if class_penalties else 0.0
    p_duration = min(100.0, sum(dur_penalties)) if dur_penalties else 0.0
    p_indication = min(100.0, sum(ind_penalties)) if ind_penalties else 0.0

    breakdown = PenaltiesBreakdown(
        p_class=p_class,
        p_duration=p_duration,
        p_indication=p_indication,
    )

    if has_tier_1:
        # Zero tolerance: immediate BLOCKED status and score = 100.0
        return 100.0, "BLOCKED", "RED", breakdown

    # 2. Mathematical Penalty Formula:
    # AMR_Risk_Score = min(100, 0.4 * P_class + 0.2 * P_duration + 0.4 * P_indication)
    raw_score = (0.4 * p_class) + (0.2 * p_duration) + (0.4 * p_indication)
    score = round(min(100.0, raw_score), 1)

    # 3. Determine Triage Status & Band
    if len(violations) == 0 and score == 0.0:
        status = "APPROVED"
        band = "GREEN"
    else:
        status = "FLAGGED"
        if score >= 75.0:
            band = "RED"
        elif score >= 35.0:
            band = "AMBER"
        else:
            band = "GREEN"

    return score, status, band, breakdown


def audit_prescription(
    patient: PatientContext,
    prescription_lines: List[PrescriptionLine],
    canonical_syndrome: Optional[str] = None,
    has_culture_report: bool = False,
    has_positive_microbiology: bool = False,
    is_outpatient: bool = True,
) -> AuditResult:
    """
    Run the complete Five-Tier Verification Pipeline deterministically.
    """
    start_time = time.perf_counter()

    # 1. Run all deterministic verification gates
    violations = evaluate_all_rules(
        patient=patient,
        prescription_lines=prescription_lines,
        canonical_syndrome=canonical_syndrome,
        has_culture_report=has_culture_report,
        has_positive_microbiology=has_positive_microbiology,
        is_outpatient=is_outpatient,
    )

    # 2. Compute bounded mathematical score and risk band
    score, status, band, penalties = calculate_score(violations)

    # 3. Generate structured remediation options
    remediations = generate_remediations(violations)

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    return AuditResult(
        status=status,
        score=score,
        band=band,
        penalties=penalties,
        flags=violations,
        remediation_options=remediations,
        latency_ms=latency_ms,
    )
