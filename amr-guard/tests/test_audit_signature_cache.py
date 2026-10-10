"""
Unit and Integration Tests for Exact Input Signature and Database Cache.
Follows testing-agent AAA structure and TDD standards.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal, init_db
from app.db.models import AuditCache
from app.schemas.audit import PrescriptionAuditRequest
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.services.signature_service import (
    compute_audit_signature,
    canonicalize_audit_input,
)
from app.services.audit_cache_service import get_cached_audit, save_cached_audit

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_db():
    init_db()


def test_should_generate_identical_signature_when_prescriptions_are_reordered():
    # [AAA] Arrange
    patient = PatientContext(age_years=45, sex="Female", is_pregnant=False, allergies="NKDA")
    line_a = PrescriptionLine(drug_name="Amoxicillin", strength="500mg", duration_days=5)
    line_b = PrescriptionLine(drug_name="Paracetamol", strength="650mg", duration_days=3)

    req1 = PrescriptionAuditRequest(
        patient=patient,
        prescription_lines=[line_a, line_b],
        canonical_syndrome="SYN_CAP_MILD",
        is_outpatient=True,
    )
    req2 = PrescriptionAuditRequest(
        patient=patient,
        prescription_lines=[line_b, line_a],  # Reverse order
        canonical_syndrome="SYN_CAP_MILD",
        is_outpatient=True,
    )

    # [AAA] Act
    sig1 = compute_audit_signature(req1)
    sig2 = compute_audit_signature(req2)

    # [AAA] Assert
    assert sig1 == sig2
    assert len(sig1) == 64  # SHA-256 64 hex characters


def test_should_generate_identical_signature_when_whitespace_or_casing_varies():
    # [AAA] Arrange
    req1 = PrescriptionAuditRequest(
        patient=PatientContext(
            age_years=28, sex="Female", is_pregnant=True, allergies="NKDA", diagnosis_text="acute cystitis"
        ),
        prescription_lines=[
            PrescriptionLine(drug_name="Cefixime", strength="200mg", duration_days=5, route="Oral")
        ],
        canonical_syndrome="SYN_UNCOMPLICATED_UTI",
        is_outpatient=True,
    )
    req2 = PrescriptionAuditRequest(
        patient=PatientContext(
            age_years=28, sex="  female  ", is_pregnant=True, allergies="none", diagnosis_text="Acute Cystitis  "
        ),
        prescription_lines=[
            PrescriptionLine(drug_name="  cefixime ", strength="200 mg", duration_days=5, route=" oral ")
        ],
        canonical_syndrome="syn_uncomplicated_uti",
        is_outpatient=True,
    )

    # [AAA] Act
    sig1 = compute_audit_signature(req1)
    sig2 = compute_audit_signature(req2)

    # [AAA] Assert
    assert sig1 == sig2


def test_should_generate_different_signature_when_clinical_details_change():
    # [AAA] Arrange
    base_req = PrescriptionAuditRequest(
        patient=PatientContext(age_years=14, sex="Male", is_pregnant=False),
        prescription_lines=[
            PrescriptionLine(drug_name="Ciprofloxacin", strength="500mg", duration_days=5)
        ],
        canonical_syndrome="SYN_UNCOMPLICATED_UTI",
        is_outpatient=True,
    )
    # Different age: 14yo vs 34yo
    diff_age_req = PrescriptionAuditRequest(
        patient=PatientContext(age_years=34, sex="Male", is_pregnant=False),
        prescription_lines=[
            PrescriptionLine(drug_name="Ciprofloxacin", strength="500mg", duration_days=5)
        ],
        canonical_syndrome="SYN_UNCOMPLICATED_UTI",
        is_outpatient=True,
    )
    # Different drug: Ciprofloxacin vs Amoxicillin
    diff_drug_req = PrescriptionAuditRequest(
        patient=PatientContext(age_years=14, sex="Male", is_pregnant=False),
        prescription_lines=[
            PrescriptionLine(drug_name="Amoxicillin", strength="500mg", duration_days=5)
        ],
        canonical_syndrome="SYN_UNCOMPLICATED_UTI",
        is_outpatient=True,
    )

    # [AAA] Act & Assert
    sig_base = compute_audit_signature(base_req)
    sig_diff_age = compute_audit_signature(diff_age_req)
    sig_diff_drug = compute_audit_signature(diff_drug_req)

    assert sig_base != sig_diff_age
    assert sig_base != sig_diff_drug


def test_should_serve_cache_hit_from_database_on_second_identical_api_call():
    # [AAA] Arrange
    payload = {
        "patient": {
            "age_years": 71,
            "sex": "Female",
            "is_pregnant": False,
            "weight_kg": 52.0,
            "egfr": 22.0,
            "allergies": "NKDA",
            "diagnosis_text": "Uncomplicated Acute Cystitis",
        },
        "prescription_lines": [
            {
                "drug_name": "Nitrofurantoin",
                "generic": "Nitrofurantoin",
                "strength": "100mg",
                "duration_days": 5,
                "is_nephrotoxic": True,
            }
        ],
        "canonical_syndrome": "SYN_UNCOMPLICATED_UTI",
        "is_outpatient": True,
    }

    # [AAA] Act 1: Initial call (Cache Miss or populates cache)
    res1 = client.post("/api/v1/audit/", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "signature" in data1
    assert data1["signature"] is not None
    assert len(data1["signature"]) == 64
    sig = data1["signature"]

    # [AAA] Act 2: Second call with exact same details (Guaranteed Cache Hit)
    res2 = client.post("/api/v1/audit/", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()

    # [AAA] Assert
    assert data2["is_cached"] is True
    assert data2["signature"] == sig
    assert data2["status"] == data1["status"]
    assert data2["score"] == data1["score"]
    assert data2["band"] == data1["band"]
    assert len(data2["flags"]) == len(data1["flags"])
    # Fast database cache lookup responds in <= 5ms
    assert data2["latency_ms"] <= 5


def test_should_track_hit_count_in_database_upon_repeated_queries():
    # [AAA] Arrange
    db: Session = SessionLocal()
    try:
        req = PrescriptionAuditRequest(
            patient=PatientContext(age_years=22, sex="Male", is_pregnant=False),
            prescription_lines=[
                PrescriptionLine(drug_name="Amoxicillin", strength="500mg", duration_days=5)
            ],
            canonical_syndrome="SYN_CAP_MILD",
            is_outpatient=True,
        )
        sig = compute_audit_signature(req)

        # Clear any prior row for clean assertion
        db.query(AuditCache).filter(AuditCache.signature == sig).delete()
        db.commit()

        # [AAA] Act 1: Make initial API call
        res1 = client.post("/api/v1/audit/", json=req.model_dump())
        assert res1.status_code == 200

        entry = db.query(AuditCache).filter(AuditCache.signature == sig).first()
        assert entry is not None
        initial_hits = entry.hit_count

        # [AAA] Act 2: Subsequent API call
        res2 = client.post("/api/v1/audit/", json=req.model_dump())
        assert res2.status_code == 200
        assert res2.json()["is_cached"] is True

        db.refresh(entry)
        # [AAA] Assert: Hit count incremented
        assert entry.hit_count >= initial_hits + 1

    finally:
        db.close()
