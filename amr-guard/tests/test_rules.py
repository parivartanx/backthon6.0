"""
Unit tests for the Five-Tier Verification Pipeline Rules in AMR-Guard.
Directly tests gates derived from ICMR STG and WHO AWaRe Framework.
"""
import pytest
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.engine.rules import (
    check_pediatric_contraindications,
    check_pregnancy_contraindications,
    check_nitrofurantoin_renal_age,
    check_nephrotoxic_renal_safety,
    check_viral_self_limiting_indication,
    check_unapproved_fdc,
    check_watch_escalation,
    check_reserve_airgap,
    check_outpatient_iv_safeguard,
    check_unmapped_syndrome_advisory,
    check_cap_duration,
    check_uti_duration,
    check_uti_fluoroquinolone_resistance,
)

# ---------------------------------------------------------------------------
# Tier 1 Tests: Patient Safety & Hard Contraindications
# ---------------------------------------------------------------------------

def test_tier1_pediatric_fluoroquinolone_blocked():
    child = PatientContext(age_years=12, sex="M")
    line = PrescriptionLine(drug_name="Ciprofloxacin", duration_days=5)
    violation = check_pediatric_contraindications(child, line)

    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert violation.penalty_score == 100.0
    assert "musculoskeletal" in violation.rationale.lower()

def test_tier1_pediatric_tetracycline_blocked():
    child = PatientContext(age_years=8, sex="F")
    line = PrescriptionLine(drug_name="Doxycycline", duration_days=7)
    violation = check_pediatric_contraindications(child, line)

    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert "dental enamel" in violation.rationale.lower()

def test_tier1_adult_fluoroquinolone_allowed():
    adult = PatientContext(age_years=35, sex="M")
    line = PrescriptionLine(drug_name="Levofloxacin", duration_days=5)
    violation = check_pediatric_contraindications(adult, line)
    assert violation is None

def test_tier1_pregnancy_contraindication_blocked():
    pregnant_pt = PatientContext(age_years=28, sex="F", is_pregnant=True)
    line = PrescriptionLine(drug_name="Levofloxacin", duration_days=5)
    violation = check_pregnancy_contraindications(pregnant_pt, line)

    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert "teratogenic" in violation.rationale.lower() or "fetal" in violation.rationale.lower()

def test_tier1_pregnancy_aminoglycoside_blocked():
    pregnant_pt = PatientContext(age_years=26, sex="F", is_pregnant=True)
    line = PrescriptionLine(drug_name="Amikacin", duration_days=3)
    violation = check_pregnancy_contraindications(pregnant_pt, line)

    assert violation is not None
    assert violation.severity == "BLOCKED"

def test_tier1_pregnancy_safe_allowed():
    pregnant_pt = PatientContext(age_years=29, sex="F", is_pregnant=True)
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)
    violation = check_pregnancy_contraindications(pregnant_pt, line)
    assert violation is None

def test_tier1_nitrofurantoin_geriatric_blocked():
    elderly = PatientContext(age_years=68, sex="F")
    line = PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)
    violation = check_nitrofurantoin_renal_age(elderly, line)

    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert "peripheral neuropathy" in violation.rationale.lower() or "renal" in violation.rationale.lower()

def test_tier1_nitrofurantoin_low_egfr_blocked():
    pt = PatientContext(age_years=45, sex="F", egfr=24.0)
    line = PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)
    violation = check_nitrofurantoin_renal_age(pt, line)

    assert violation is not None
    assert violation.severity == "BLOCKED"

def test_tier1_nitrofurantoin_young_normal_egfr_allowed():
    pt = PatientContext(age_years=30, sex="F", egfr=95.0)
    line = PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)
    violation = check_nitrofurantoin_renal_age(pt, line)
    assert violation is None

def test_tier1_vancomycin_missing_egfr_blocked():
    """In an elderly patient (69yo) or any patient with missing eGFR, IV Vancomycin must be BLOCKED."""
    patient = PatientContext(age_years=69, sex="M", egfr=None)
    line = PrescriptionLine(
        drug_name="Vancomycin",
        is_nephrotoxic=True,
        requires_egfr=True,
        duration_days=5
    )
    violation = check_nephrotoxic_renal_safety(patient, line)
    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"
    assert violation.penalty_score == 100.0
    assert "renal" in violation.remediation.lower() or "egfr" in violation.rationale.lower()

def test_tier1_vancomycin_low_egfr_blocked():
    """eGFR < 30 mL/min with nephrotoxic drug must trigger BLOCKED status."""
    patient = PatientContext(age_years=45, sex="F", egfr=22.0)
    line = PrescriptionLine(
        drug_name="Vancomycin",
        is_nephrotoxic=True,
        requires_egfr=True,
        duration_days=5
    )
    violation = check_nephrotoxic_renal_safety(patient, line)
    assert violation is not None
    assert violation.tier == 1
    assert violation.severity == "BLOCKED"


# ---------------------------------------------------------------------------
# Tier 2 Tests: Indication & Diagnosis Legitimacy
# ---------------------------------------------------------------------------

def test_tier2_viral_urti_antibiotic_flagged():
    line = PrescriptionLine(drug_name="Azithromycin", duration_days=3)
    violation = check_viral_self_limiting_indication("Viral URTI", line)

    assert violation is not None
    assert violation.tier == 2
    assert violation.penalty_type == "indication"
    assert violation.penalty_score == 100.0
    assert "symptomatic supportive therapy" in violation.remediation.lower()

def test_tier2_acute_watery_diarrhea_antibiotic_flagged():
    line = PrescriptionLine(drug_name="Norfloxacin", duration_days=5)
    violation = check_viral_self_limiting_indication("Acute Watery Diarrhea", line)

    assert violation is not None
    assert violation.penalty_score == 100.0
    assert "ors + zinc" in violation.remediation.lower()

def test_tier2_bacterial_infection_not_flagged():
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)
    violation = check_viral_self_limiting_indication("SYN_CAP_MILD", line)
    assert violation is None

def test_tier2_unapproved_fdc_flagged():
    line = PrescriptionLine(drug_name="Ofloxacin + Ornidazole", duration_days=5)
    violation = check_unapproved_fdc(line)

    assert violation is not None
    assert violation.tier == 2
    assert violation.penalty_type == "fdc"
    assert "not recommended" in violation.rationale.lower()

# ---------------------------------------------------------------------------
# Tier 3 Tests: WHO AWaRe Spectrum Escalation
# ---------------------------------------------------------------------------

def test_tier3_watch_escalation_without_culture():
    line = PrescriptionLine(drug_name="Cefixime", duration_days=5)
    violation = check_watch_escalation("SYN_CAP_MILD", line, has_culture_report=False)

    assert violation is not None
    assert violation.tier == 3
    assert violation.penalty_type == "class"
    assert violation.penalty_score == 45.0
    assert "amoxicillin" in violation.remediation.lower()

def test_tier3_watch_allowed_with_culture():
    line = PrescriptionLine(drug_name="Cefixime", duration_days=5)
    violation = check_watch_escalation("SYN_CAP_MILD", line, has_culture_report=True)
    assert violation is None

def test_tier3_reserve_airgap_outpatient_flagged():
    line = PrescriptionLine(drug_name="Meropenem", duration_days=7)
    violation = check_reserve_airgap(line, is_outpatient=True, has_positive_microbiology=False)

    assert violation is not None
    assert violation.tier == 3
    assert violation.penalty_score == 85.0
    assert "administrative quarantine" in violation.remediation.lower()

def test_tier3_reserve_allowed_with_microbiology():
    line = PrescriptionLine(drug_name="Meropenem", duration_days=7)
    violation = check_reserve_airgap(line, is_outpatient=False, has_positive_microbiology=True)
    assert violation is None

# ---------------------------------------------------------------------------
# Tier 4 Tests: Duration Limits
# ---------------------------------------------------------------------------

def test_tier4_cap_duration_exceeded():
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=8)
    violation = check_cap_duration("SYN_CAP_MILD", line)

    assert violation is not None
    assert violation.tier == 4
    # delta = 8 - 5 = 3; 3 * 15 = 45.0
    assert violation.penalty_score == 45.0
    assert "shorten duration to 5 days" in violation.remediation.lower()

def test_tier4_cap_duration_within_limit():
    line = PrescriptionLine(drug_name="Amoxicillin", duration_days=5)
    violation = check_cap_duration("SYN_CAP_MILD", line)
    assert violation is None

def test_tier4_uti_nitrofurantoin_duration_exceeded():
    line = PrescriptionLine(drug_name="Nitrofurantoin", duration_days=7)
    violation = check_uti_duration("SYN_UNCOMPLICATED_UTI", line)

    assert violation is not None
    assert violation.tier == 4
    # delta = 7 - 5 = 2; 2 * 15 = 30.0
    assert violation.penalty_score == 30.0

def test_tier4_uti_fosfomycin_multi_day_flagged():
    line = PrescriptionLine(drug_name="Fosfomycin", duration_days=3)
    violation = check_uti_duration("SYN_UNCOMPLICATED_UTI", line)

    assert violation is not None
    assert violation.tier == 4
    # delta = 3 - 1 = 2; 2 * 15 = 30.0
    assert violation.penalty_score == 30.0
    assert "single-dose" in violation.remediation.lower()

# ---------------------------------------------------------------------------
# Tier 5 Tests: Local Pathogen Resistance Benchmarking
# ---------------------------------------------------------------------------

def test_tier5_uti_fluoroquinolone_resistance_flagged():
    line = PrescriptionLine(drug_name="Ciprofloxacin", duration_days=5)
    violation = check_uti_fluoroquinolone_resistance("SYN_UNCOMPLICATED_UTI", line)

    assert violation is not None
    assert violation.tier == 5
    assert ">75% resistance" in violation.rationale
    assert "switch empirical therapy to nitrofurantoin" in violation.remediation.lower()

def test_outpatient_iv_glycopeptide_flagged():
    """IV Vancomycin in outpatient setting without culture must trigger Outpatient Parenteral Safeguard."""
    line = PrescriptionLine(
        drug_name="Vancomycin",
        route="Intravenous",
        outpatient_iv_restricted=True,
        duration_days=5
    )
    violation = check_outpatient_iv_safeguard(line, is_outpatient=True, has_culture_report=False)
    assert violation is not None
    assert violation.severity == "HIGH"
    assert violation.penalty_score == 60.0

def test_unmapped_syndrome_watch_drug_advisory_flag():
    """Prescribing Watch/Reserve drug for vague 'Fever and cough' with no culture triggers soft advisory."""
    line = PrescriptionLine(drug_name="Vancomycin", aware_tier="Watch")
    violation = check_unmapped_syndrome_advisory(canonical_syndrome="Fever and cough since 3 days", line=line, has_culture_report=False)
    assert violation is not None
    assert violation.penalty_score == 30.0
    assert violation.penalty_type == "indication"

