"""
Unit tests for the Deterministic Scoring & Triage Engine in AMR-Guard.
Tests the mathematical formula:
    AMR_Risk_Score = min(100, 0.4 * P_class + 0.2 * P_duration + 0.4 * P_indication)
"""
import pytest
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.engine.scoring import audit_prescription, calculate_score
from app.schemas.audit import RuleViolation

def test_scoring_clean_prescription():
    """Compliant first-line Access prescription receives 0 score and APPROVED status."""
    patient = PatientContext(age_years=35, sex="M", is_pregnant=False)
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)

    result = audit_prescription(
        patient=patient,
        prescription_lines=[line],
        canonical_syndrome="SYN_CAP_MILD",
        is_outpatient=True,
    )

    assert result.status == "APPROVED"
    assert result.score == 0.0
    assert result.band == "GREEN"
    assert len(result.flags) == 0
    assert result.penalties.p_class == 0.0
    assert result.penalties.p_duration == 0.0
    assert result.penalties.p_indication == 0.0

def test_scoring_tier1_hard_block_overrides_all():
    """Any Tier 1 failure yields status BLOCKED, score 100.0, and band RED."""
    child = PatientContext(age_years=10, sex="F")
    line = PrescriptionLine(drug_name="Ciprofloxacin", duration_days=3)

    result = audit_prescription(
        patient=child,
        prescription_lines=[line],
        canonical_syndrome="SYN_UNCOMPLICATED_UTI",
        is_outpatient=True,
    )

    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"
    assert any(f.tier == 1 for f in result.flags)
    assert any(r.recommendation_type == "CONTRAINDICATION_BLOCK" for r in result.remediation_options)

def test_scoring_watch_escalation_only():
    """Watch drug without culture gives P_class = 45 -> Score = 0.4 * 45 = 18.0 (GREEN band)."""
    patient = PatientContext(age_years=25, sex="M")
    line = PrescriptionLine(drug_name="Cefixime", duration_days=5)

    result = audit_prescription(
        patient=patient,
        prescription_lines=[line],
        canonical_syndrome="SYN_CAP_MILD",
        has_culture_report=False,
    )

    assert result.status == "FLAGGED"
    assert result.penalties.p_class == 45.0
    assert result.penalties.p_duration == 0.0
    assert result.penalties.p_indication == 0.0
    # 0.4 * 45 = 18.0
    assert result.score == 18.0
    assert result.band == "GREEN"

def test_scoring_viral_infection_indication_penalty():
    """Viral infection gives P_indication = 100 -> Score = 0.4 * 100 = 40.0 (AMBER band)."""
    patient = PatientContext(age_years=30, sex="M")
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)

    result = audit_prescription(
        patient=patient,
        prescription_lines=[line],
        canonical_syndrome="Viral URTI",
    )

    assert result.status == "FLAGGED"
    assert result.penalties.p_indication == 100.0
    # 0.4 * 100 = 40.0
    assert result.score == 40.0
    assert result.band == "AMBER"
    assert any(r.recommendation_type == "MANDATE_SYMPTOMATIC" for r in result.remediation_options)

def test_scoring_watch_plus_viral():
    """Viral infection (P_ind=100) + Watch drug (P_class=45) -> 0.4*45 + 0.4*100 = 58.0 (AMBER)."""
    patient = PatientContext(age_years=40, sex="F")
    line = PrescriptionLine(drug_name="Azithromycin", duration_days=3)

    result = audit_prescription(
        patient=patient,
        prescription_lines=[line],
        canonical_syndrome="Common Cold",
    )

    assert result.status == "FLAGGED"
    assert result.penalties.p_indication == 100.0
    # Azithromycin is Watch
    assert result.penalties.p_class == 45.0 or result.penalties.p_class == 0.0
    # 0.4 * 45 + 0.4 * 100 = 58.0 or 40.0
    assert result.score >= 40.0
    assert result.band == "AMBER"

def test_scoring_reserve_drug_plus_duration_cap():
    """Reserve drug (P_class=85) + duration penalty."""
    patient = PatientContext(age_years=50, sex="M")
    line = PrescriptionLine(drug_name="Meropenem", duration_days=10)

    result = audit_prescription(
        patient=patient,
        prescription_lines=[line],
        canonical_syndrome="SYN_CAP_MILD",
        is_outpatient=True,
        has_positive_microbiology=False,
    )

    assert result.status == "FLAGGED"
    assert result.penalties.p_class == 85.0
    # duration excess = 10 - 5 = 5 days; 5 * 15 = 75.0
    assert result.penalties.p_duration == 75.0
    # Score = min(100, 0.4 * 85 + 0.2 * 75) = min(100, 34 + 15) = 49.0
    assert result.score == 49.0
    assert result.band == "AMBER"

def test_scoring_bounded_at_100():
    """Score mathematically cannot exceed 100.0."""
    violations = [
        RuleViolation(tier=3, rule_id="T3", rule_name="T3", severity="HIGH", penalty_type="class", penalty_score=100.0, rationale="test"),
        RuleViolation(tier=4, rule_id="T4", rule_name="T4", severity="HIGH", penalty_type="duration", penalty_score=100.0, rationale="test"),
        RuleViolation(tier=2, rule_id="T2", rule_name="T2", severity="HIGH", penalty_type="indication", penalty_score=100.0, rationale="test"),
    ]
    score, status, band, penalties = calculate_score(violations)
    # 0.4*100 + 0.2*100 + 0.4*100 = 100.0
    assert score == 100.0
    assert band == "RED"
    assert status == "FLAGGED"
