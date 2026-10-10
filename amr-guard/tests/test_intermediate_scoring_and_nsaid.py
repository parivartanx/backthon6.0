"""
Unit tests evaluating intermediate risk scoring and dual NSAID therapeutic duplication.
Tests that prescriptions with intermediate clinical risks produce scores between 0 and 100,
and that dual NSAIDs (Diclofenac + Ibuprofen as in CASE-2026-0891) are flagged.
"""
import pytest
from unittest.mock import MagicMock, patch
import json
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.engine.scoring import audit_prescription
from app.agents.rag_audit import audit_prescription_rag_first


def test_should_flag_dual_nsaid_duplication_with_intermediate_score():
    # [TDD: RED] — this test should fail before implementation of NSAID duplication rule
    # [AAA] — Arrange
    patient = PatientContext(
        age_years=29,
        sex="Female",
        is_pregnant=False,
        egfr=102.0,
        allergies="No known drug allergies",
        diagnosis_text="Productive cough, fever for 3 days, mild chest discomfort (Suspected Respiratory Infection)"
    )
    lines = [
        PrescriptionLine(drug_name="Diclofenac", generic="Diclofenac Sodium", strength="50 mg", frequency="1 tablet PO", duration_days=5),
        PrescriptionLine(drug_name="Ibuprofen", generic="Ibuprofen", strength="400 mg", frequency="1 tablet PO", duration_days=5)
    ]

    # [AAA] — Act
    result = audit_prescription(
        patient=patient,
        prescription_lines=lines,
        canonical_syndrome=None,
        is_outpatient=True,
    )

    # [AAA] — Assert
    # The prescription must NOT be APPROVED with 0 score
    assert result.status == "FLAGGED"
    # Score should be an intermediate value between 0 and 100 (not 0.0 and not 100.0)
    assert 15.0 <= result.score <= 40.0
    assert result.band in ["GREEN", "AMBER"]
    assert any(f.rule_id == "TIER2_NSAID_DUPLICATION_HAZARD" for f in result.flags)
    assert any("Paracetamol" in r.guidance or "Paracetamol" in (r.suggested_drug or "") for r in result.remediation_options)


def test_should_not_clobber_intermediate_score_with_uncalibrated_llm_score():
    # [TDD: RED] — test that rag_audit uses the authoritative mathematical formula
    # [AAA] — Arrange
    patient = PatientContext(age_years=35, sex="M", is_pregnant=False)
    lines = [PrescriptionLine(drug_name="Cefixime", duration_days=5)]

    # Mock LLM returning an uncalibrated high score of 100.0 despite only Watch class penalty
    llm_payload = {
        "status": "FLAGGED",
        "score": 100.0,  # Uncalibrated LLM score
        "band": "RED",
        "penalties": {"p_class": 45.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [
            {
                "tier": 3,
                "rule_id": "TIER3_AWARE_WATCH_ESCALATION",
                "rule_name": "Watch-Group Over-Escalation Check",
                "severity": "MEDIUM",
                "drug": "Cefixime",
                "penalty_type": "class",
                "penalty_score": 45.0,
                "rationale": "Cefixime is Watch group prescribed empirically.",
                "remediation": "Switch to Amoxicillin.",
                "citation": "WHO AWaRe"
            }
        ],
        "remediation_options": []
    }

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(llm_payload)
    mock_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] — Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "test-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="ICMR guidelines"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_CAP_MILD",
            is_outpatient=True,
        )

    # [AAA] — Assert
    # 0.4 * 45 = 18.0. The score MUST be 18.0 (intermediate score), NOT 100.0!
    assert result.score == 18.0
    assert result.status == "FLAGGED"
    assert result.band == "GREEN"
