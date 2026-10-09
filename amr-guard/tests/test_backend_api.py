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


def test_unversioned_extract_route():
    """Verify unversioned /extract/ and /extract routes respond with HTTP 200 (avoiding 405 Method Not Allowed)."""
    payload = {
        "text": "Rx: Amoxicillin 500mg TDS for 5 days. Patient: 32yo male presenting with Mild Community-Acquired Pneumonia."
    }
    # Test unversioned with trailing slash
    res_slash = client.post("/extract/", json=payload)
    assert res_slash.status_code == 200
    assert res_slash.json()["patient"]["age_years"] == 32

    # Test unversioned without trailing slash
    res_no_slash = client.post("/extract", json=payload)
    assert res_no_slash.status_code == 200
    assert res_no_slash.json()["patient"]["age_years"] == 32


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


def _generate_test_pdf_bytes(rx_text: str = "Rx: Amoxicillin 500mg TDS for 5 days. Patient: 32yo male.") -> bytes:
    """Helper to generate a valid, spec-compliant single-page PDF containing text."""
    stream_content = f"BT\n/F1 12 Tf\n72 712 Td\n({rx_text}) Tj\nET\n".encode()
    pdf_parts = [
        b"%PDF-1.4\n",
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        b"4 0 obj\n<< /Length " + str(len(stream_content)).encode() + b" >>\nstream\n" + stream_content + b"endstream\nendobj\n",
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ]
    offsets = [0]
    cum = 0
    for p in pdf_parts:
        cum += len(p)
        offsets.append(cum)

    xref = b"xref\n0 6\n0000000000 65535 f \n"
    for off in offsets[1:-1]:
        xref += f"{off:010d} 00000 n \n".encode()

    trailer = f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{cum}\n%%EOF".encode()
    return b"".join(pdf_parts) + xref + trailer


def test_image_extraction_endpoint():
    """Verify multimodal image upload endpoint (/api/v1/audit/from-image)."""
    fake_image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("rx_sample.png", fake_image_bytes, "image/png")}
    response = client.post("/api/v1/audit/from-image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "patient" in data
    assert "prescription_lines" in data


def test_pdf_extraction_via_from_image_endpoint():
    """Verify PDF document upload to /api/v1/audit/from-image endpoint."""
    pdf_bytes = _generate_test_pdf_bytes()
    files = {"file": ("prescription_order.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/v1/audit/from-image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["patient"]["age_years"] == 32
    assert data["patient"]["sex"] == "M"
    assert len(data["prescription_lines"]) >= 1
    assert data["prescription_lines"][0]["drug_name"] == "Amoxicillin"


def test_pdf_extraction_via_from_document_endpoint():
    """Verify PDF document upload to /api/v1/audit/from-document endpoint."""
    pdf_bytes = _generate_test_pdf_bytes()
    files = {"file": ("rx_record.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/v1/audit/from-document", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["patient"]["age_years"] == 32
    assert len(data["prescription_lines"]) >= 1


def test_pdf_extraction_via_extract_document_endpoint():
    """Verify PDF document extraction on /api/v1/extract/document endpoint."""
    pdf_bytes = _generate_test_pdf_bytes()
    files = {"file": ("clinic_chart.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/v1/extract/document", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["patient"]["age_years"] == 32
    assert data["prescription_lines"][0]["drug_name"] == "Amoxicillin"



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


def test_cors_preflight_options():
    """Verify that HTTP OPTIONS preflight requests succeed with CORS headers."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
    }
    response = client.options("/api/v1/stats/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") in ["http://localhost:3000", "*"]
    assert "GET" in response.headers.get("access-control-allow-methods", "")

    # Also verify without trailing slash
    response_no_slash = client.options("/api/v1/stats", headers=headers)
    assert response_no_slash.status_code == 200


def test_prescriptions_list_endpoint():
    """Verify GET /api/v1/prescriptions and /api/v1/prescriptions/ return 200 OK with clinical cases."""
    # Without trailing slash
    res_no_slash = client.get("/api/v1/prescriptions")
    assert res_no_slash.status_code == 200
    cases_no_slash = res_no_slash.json()
    assert isinstance(cases_no_slash, list)
    assert len(cases_no_slash) >= 4

    # With trailing slash
    res_slash = client.get("/api/v1/prescriptions/")
    assert res_slash.status_code == 200
    cases_slash = res_slash.json()
    assert isinstance(cases_slash, list)
    assert len(cases_slash) >= 4

    # Verify case structure matches frontend expectations
    first_case = cases_slash[0]
    assert "id" in first_case
    assert "patient" in first_case
    assert "medicines" in first_case
    assert "workflowStatus" in first_case


def test_prescriptions_cors_preflight():
    """Verify OPTIONS /api/v1/prescriptions returns 200 OK with CORS headers."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
    }
    response = client.options("/api/v1/prescriptions", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") in ["http://localhost:3000", "*"]


def test_prescriptions_get_by_id():
    """Verify GET /api/v1/prescriptions/{case_id} retrieves matching case from database."""
    list_res = client.get("/api/v1/prescriptions")
    assert list_res.status_code == 200
    cases = list_res.json()
    assert len(cases) > 0
    target_id = cases[0]["id"]

    response = client.get(f"/api/v1/prescriptions/{target_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == target_id
    assert "patient" in data
    assert "medicines" in data


def test_prescriptions_create_and_audit():
    """Verify POST /api/v1/prescriptions creates a new case and calculates audit."""
    new_case_payload = {
        "id": "CASE-TEST-9999",
        "sourceType": "manual",
        "sourceText": "Rx: Ciprofloxacin 500mg BD x 3d for cystitis in 29yo female",
        "patient": {
            "caseId": "CASE-TEST-9999",
            "age": 29,
            "age_years": 29,
            "sex": "Female",
            "pregnancyStatus": "Not pregnant",
            "allergies": "NKDA",
            "symptoms": "Dysuria",
            "medicalHistory": "Nil",
            "suspectedDiagnosis": "Uncomplicated Acute Cystitis",
            "canonical_syndrome": "SYN_UNCOMPLICATED_UTI",
            "is_outpatient": True
        },
        "medicines": [
            {
                "id": "med-t1",
                "brandName": "Cifran",
                "genericName": "Ciprofloxacin",
                "strength": "500 mg",
                "dose": "1 tablet",
                "route": "Oral",
                "frequency": "BD",
                "duration": "3 days",
                "duration_days": 3,
                "verificationStatus": "Verified"
            }
        ],
        "workflowStatus": "Ready for Audit"
    }
    response = client.post("/api/v1/prescriptions/", json=new_case_payload)
    assert response.status_code == 200
    created = response.json()
    assert created["id"] == "CASE-TEST-9999"
    assert created["auditResult"] is not None
    assert "status" in created["auditResult"]
    assert "score" in created["auditResult"]

