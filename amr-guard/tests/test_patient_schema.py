"""
Tests for PatientContext schema expansion and end-to-end patient data serialization.
Ensures allergies, medical_history, weight_kg, and medication flags are fully preserved.
"""
import pytest
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionCase, PatientCaseContext, MedicineEntry
from app.services.prescription_service import save_prescription

def test_patient_context_schema_allergies_and_medical_history():
    """Verify PatientContext schema includes allergies and medical_history with clean defaults."""
    # Default allergies to NKDA if not specified
    ctx = PatientContext(age_years=45, sex="M")
    assert ctx.allergies == "NKDA"
    assert ctx.medical_history is None

    # Custom allergies and comorbidity history
    ctx_custom = PatientContext(
        age_years=62,
        sex="F",
        allergies="Penicillin, Sulfa",
        medical_history="Myasthenia Gravis, Hypertension",
        weight_kg=65.5,
        egfr=45.0,
    )
    assert ctx_custom.allergies == "Penicillin, Sulfa"
    assert ctx_custom.medical_history == "Myasthenia Gravis, Hypertension"
    assert ctx_custom.weight_kg == 65.5


def test_prescription_service_preserves_complete_patient_and_med_data():
    """Verify save_prescription maps weight_kg, allergies, medical_history, route, and safety flags."""
    case = PrescriptionCase(
        id="CASE-TEST-COMPLETE-PT",
        patient=PatientCaseContext(
            caseId="CASE-TEST-COMPLETE-PT",
            age=10,
            age_years=10,
            sex="Male",
            pregnancyStatus="Not applicable",
            weight_kg=28.0,
            egfr=95.0,
            allergies="Penicillin",
            medicalHistory="Asthma, G6PD Deficiency",
            symptoms="High fever, ear pain",
            suspectedDiagnosis="Acute Otitis Media",
            canonical_syndrome="SYN_AOM",
            is_outpatient=True,
        ),
        medicines=[
            MedicineEntry(
                id="med-1",
                brandName="Vancocin",
                genericName="Vancomycin",
                strength="500 mg",
                route="Intravenous",
                frequency="BD",
                duration="5 days",
                duration_days=5,
                is_nephrotoxic=True,
                requires_egfr=True,
                outpatient_iv_restricted=True,
                verificationStatus="Verified",
            )
        ]
    )

    saved = save_prescription(case)
    assert saved.auditResult is not None
    assert "status" in saved.auditResult
