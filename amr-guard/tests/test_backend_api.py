"""
Comprehensive backend API tests for AMR-Guard.
Covers root status, health checks, OpenAPI metadata, API routers, and Five-Tier audits.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root GET endpoint responds."""
    response = client.get("/")
    assert response.status_code == 200
    # Depending on whether frontend build exists, returns either HTML or stub JSON message
    assert response.text != ""


def test_health_endpoints():
    """Verify both /api/v1 and /api/v1/health return 200 OK."""
    res_root = client.get("/api/v1/")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "ok"

    res_health = client.get("/api/v1/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"


def test_openapi_documentation():
    """Verify OpenAPI schema and docs are generated."""
    res_openapi = client.get("/openapi.json")
    assert res_openapi.status_code == 200
    schema = res_openapi.json()
    assert schema["info"]["title"] == "AMR-Guard API"
    assert "/api/v1/audit/" in schema["paths"]


def test_extract_endpoint():
    """Verify entity extraction endpoint (/api/v1/extract)."""
    payload = {
        "text": "Rx: Amoxicillin 500mg TDS for 5 days. Patient: 32yo male presenting with Mild Community-Acquired Pneumonia."
    }
    response = client.post("/api/v1/extract/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["patient"]["age_years"] == 32
    assert len(data["prescription_lines"]) >= 1
    assert data["confidence_score"] > 0.5


def test_remediate_endpoint():
    """Verify dynamic remediation endpoint (/api/v1/remediate)."""
    payload = {
        "canonical_syndrome": "SYN_CAP_MILD",
        "flagged_drug": "Levofloxacin",
        "patient": {
            "age_years": 35,
            "sex": "M",
            "is_pregnant": False
        }
    }
    response = client.post("/api/v1/remediate/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Amoxicillin" in data["first_line_access_regimen"]
    assert len(data["options"]) >= 1
    assert any(opt["recommendation_type"] in ["SWITCH_DRUG", "MANDATE_SYMPTOMATIC"] for opt in data["options"])


def test_stats_endpoint():
    """Verify stewardship surveillance statistics endpoint (/api/v1/stats)."""
    response = client.get("/api/v1/stats/")
    assert response.status_code == 200
    data = response.json()
    assert data["total_audits"] > 0
    assert "access_pct" in data["aware_distribution"]
    assert "ICMR_AMRSN_E_COLI_FQ_RESISTANCE" in data["surveillance_benchmarks"]


def test_image_extraction_endpoint():
    """Verify multimodal image upload endpoint (/api/v1/audit/from-image)."""
    fake_image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("rx_sample.png", fake_image_bytes, "image/png")}
    response = client.post("/api/v1/audit/from-image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "patient" in data
    assert "prescription_lines" in data


def test_audit_pregnancy_contraindication():
    """Tier 1: Pregnant patient prescribed Doxycycline must be BLOCKED."""
    payload = {
        "patient": {
            "age_years": 26,
            "sex": "F",
            "is_pregnant": True
        },
        "prescription_lines": [
            {
                "drug_name": "Doxycycline",
                "duration_days": 7
            }
        ],
        "canonical_syndrome": "SYN_CAP_MILD",
        "is_outpatient": True
    }
    response = client.post("/api/v1/audit/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert data["score"] == 100.0
    assert data["band"] == "RED"
    assert any(flag["severity"] == "BLOCKED" for flag in data["flags"])


def test_audit_geriatric_nitrofurantoin_contraindication():
    """Tier 1: Geriatric patient (>= 65) prescribed Nitrofurantoin must be BLOCKED."""
    payload = {
        "patient": {
            "age_years": 72,
            "sex": "F",
            "is_pregnant": False
        },
        "prescription_lines": [
            {
                "drug_name": "Nitrofurantoin",
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


def test_audit_irrational_fdc():
    """Tier 2: Irrational FDC (Ofloxacin + Ornidazole) must be flagged with a penalty."""
    payload = {
        "patient": {
            "age_years": 35,
            "sex": "M",
            "is_pregnant": False
        },
        "prescription_lines": [
            {
                "drug_name": "Ofloxacin + Ornidazole",
                "duration_days": 5
            }
        ],
        "canonical_syndrome": "Acute Watery Diarrhea",
        "is_outpatient": True
    }
    response = client.post("/api/v1/audit/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["FLAGGED", "BLOCKED"]
    assert any("FDC" in flag["rule_id"] or "IRRATIONAL" in flag["rule_id"] for flag in data["flags"])


def test_audit_excess_duration_cap():
    """Tier 4: CAP prescribed for 10 days (cap is 5 days) must incur duration penalty."""
    payload = {
        "patient": {
            "age_years": 40,
            "sex": "M",
            "is_pregnant": False
        },
        "prescription_lines": [
            {
                "drug_name": "Amoxicillin",
                "duration_days": 10
            }
        ],
        "canonical_syndrome": "SYN_CAP_MILD",
        "is_outpatient": True
    }
    response = client.post("/api/v1/audit/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["penalties"]["p_duration"] > 0.0
    assert data["status"] == "FLAGGED"
