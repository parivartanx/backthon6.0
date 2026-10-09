"""
Integration tests for the /api/v1/audit endpoint using FastAPI TestClient.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_audit_api_clean_prescription():
    payload = {
        "patient": {
            "age_years": 32,
            "sex": "M",
            "is_pregnant": False
        },
        "prescription_lines": [
            {
                "drug_name": "Amoxicillin",
                "duration_days": 5
            }
        ],
        "canonical_syndrome": "SYN_CAP_MILD",
        "is_outpatient": True
    }
    response = client.post("/api/v1/audit/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["score"] == 0.0
    assert data["band"] == "GREEN"
    assert len(data["flags"]) == 0

def test_audit_api_pediatric_contraindication_blocked():
    payload = {
        "patient": {
            "age_years": 14,
            "sex": "M",
            "is_pregnant": False
        },
        "prescription_lines": [
            {
                "drug_name": "Ciprofloxacin",
                "duration_days": 5
            }
        ],
        "canonical_syndrome": "SYN_UNCOMPLICATED_UTI",
        "is_outpatient": True
    }
    response = client.post("/api/v1/audit/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert data["score"] == 100.0
    assert data["band"] == "RED"
    assert len(data["flags"]) >= 1
    assert data["flags"][0]["severity"] == "BLOCKED"

def test_audit_api_viral_infection_indication_penalty():
    payload = {
        "patient": {
            "age_years": 28,
            "sex": "F",
            "is_pregnant": False
        },
        "prescription_lines": [
            {
                "drug_name": "Azithromycin",
                "duration_days": 3
            }
        ],
        "canonical_syndrome": "Viral URTI",
        "is_outpatient": True
    }
    response = client.post("/api/v1/audit/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "FLAGGED"
    assert data["score"] >= 40.0
    assert data["penalties"]["p_indication"] == 100.0

def test_audit_api_validation_error():
    # Empty payload
    response = client.post("/api/v1/audit/", json={})
    assert response.status_code == 400
