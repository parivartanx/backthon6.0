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
    # [AAA] Arrange
    patient = PatientContext(age_years=30, sex="M", allergies="NKDA")
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)

    # [AAA] Act
    violation = check_drug_allergy_contraindications(patient, line)

    # [AAA] Assert
    assert violation is None


def test_fluoroquinolone_allergy_ciprofloxacin_blocked():
    """Documented Fluoroquinolone allergy must block Ciprofloxacin."""
    # [AAA] Arrange
    patient = PatientContext(age_years=45, sex="M", allergies="Ciprofloxacin allergy - hives and facial swelling")
    line = PrescriptionLine(drug_name="Ciprofloxacin", duration_days=5)

    # [AAA] Act
    violation = check_drug_allergy_contraindications(patient, line)

    # [AAA] Assert
    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert violation.penalty_score == 100.0
    assert violation.rule_id == "TIER1_DRUG_ALLERGY_CONTRAINDICATION"


def test_macrolide_allergy_azithromycin_blocked():
    """Documented Macrolide allergy must block Azithromycin."""
    # [AAA] Arrange
    patient = PatientContext(age_years=32, sex="F", allergies="Macrolides (Azithromycin)")
    line = PrescriptionLine(drug_name="Azithromycin", duration_days=3)

    # [AAA] Act
    violation = check_drug_allergy_contraindications(patient, line)

    # [AAA] Assert
    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert violation.penalty_score == 100.0
    assert violation.rule_id == "TIER1_DRUG_ALLERGY_CONTRAINDICATION"


def test_cephalosporin_allergy_ceftriaxone_blocked():
    """Documented Cephalosporin allergy must block Ceftriaxone."""
    # [AAA] Arrange
    patient = PatientContext(age_years=50, sex="M", allergies="Cephalosporins")
    line = PrescriptionLine(drug_name="Ceftriaxone", duration_days=7)

    # [AAA] Act
    violation = check_drug_allergy_contraindications(patient, line)

    # [AAA] Assert
    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert violation.penalty_score == 100.0
    assert violation.rule_id == "TIER1_DRUG_ALLERGY_CONTRAINDICATION"


def test_rule_registry_evaluates_allergy():
    """evaluate_all_rules must include allergy violation in output list."""
    from app.engine.rule_registry import evaluate_all_rules
    # [AAA] Arrange
    patient = PatientContext(age_years=35, sex="F", allergies="Severe Penicillin allergy")
    lines = [PrescriptionLine(drug_name="Amoxicillin", duration_days=5)]

    # [AAA] Act
    violations = evaluate_all_rules(patient, lines)

    # [AAA] Assert
    allergy_violations = [v for v in violations if v.rule_id == "TIER1_DRUG_ALLERGY_CONTRAINDICATION"]
    assert len(allergy_violations) == 1
    assert allergy_violations[0].severity == "BLOCKED"

