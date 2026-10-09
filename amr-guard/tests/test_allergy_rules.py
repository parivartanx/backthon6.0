"""
Unit tests for Tier 1 and Tier 2 Drug Allergy Safety Verification in AMR-Guard.
Tests zero-tolerance allergy halts and beta-lactam cross-reactivity warnings.
"""
import pytest
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.engine.rules import check_drug_allergy_contraindications

def test_penicillin_allergy_amoxicillin_blocked():
    """Documented Penicillin allergy must block Amoxicillin as a Tier 1 Hard Stop."""
    patient = PatientContext(age_years=35, sex="M", allergies="Severe Penicillin allergy")
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)
    violation = check_drug_allergy_contraindications(patient, line)

    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert violation.penalty_score == 100.0
    assert "penicillin" in violation.rationale.lower()
    assert violation.rule_id == "TIER1_DRUG_ALLERGY_CONTRAINDICATION"


def test_sulfa_allergy_cotrimoxazole_blocked():
    """Documented Sulfa allergy must block Co-trimoxazole as a Tier 1 Hard Stop."""
    patient = PatientContext(age_years=40, sex="F", allergies="Sulfa / Sulfonamide allergy")
    line = PrescriptionLine(drug_name="Co-trimoxazole", duration_days=5)
    violation = check_drug_allergy_contraindications(patient, line)

    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert violation.penalty_score == 100.0
    assert violation.rule_id == "TIER1_DRUG_ALLERGY_CONTRAINDICATION"


def test_penicillin_allergy_cephalosporin_cross_reactivity_warning():
    """Penicillin allergy prescribed 3rd gen Cephalosporin must trigger Tier 2 Cross-Reactivity Alert."""
    patient = PatientContext(age_years=28, sex="F", allergies="Penicillin")
    line = PrescriptionLine(drug_name="Cefixime", duration_days=5)
    violation = check_drug_allergy_contraindications(patient, line)

    assert violation is not None
    assert violation.tier == 2
    assert violation.severity == "HIGH"
    assert violation.penalty_score == 60.0
    assert violation.rule_id == "TIER2_ALLERGY_CROSS_REACTIVITY_WARNING"


def test_nkda_no_allergy_violation():
    """Patient with NKDA or No Known Drug Allergies must have 0 allergy violations."""
    patient = PatientContext(age_years=30, sex="M", allergies="NKDA")
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)
    violation = check_drug_allergy_contraindications(patient, line)

    assert violation is None
