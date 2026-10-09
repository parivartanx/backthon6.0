"""
Unit tests for the RAG-First Clinical Prescription Audit Agent (app.agents.rag_audit).
Tests Hybrid RAG + LLM clinical evaluation and graceful deterministic safety fallback.
Follows testing-agent guidelines with AAA structure and TDD cycle.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.audit import AuditResult, RuleViolation
from app.agents.rag_audit import audit_prescription_rag_first


def test_rag_audit_fallback_when_unconfigured():
    """When LLM API key is absent or empty, gracefully fallback to deterministic engine."""
    # [AAA] Arrange
    patient = PatientContext(age_years=35, sex="M", is_pregnant=False)
    lines = [PrescriptionLine(drug_name="Amoxicillin", duration_days=5)]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", ""):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_CAP_MILD",
            is_outpatient=True,
        )

    # [AAA] Assert
    assert isinstance(result, AuditResult)
    assert result.status == "APPROVED"
    assert result.score == 0.0
    assert result.band == "GREEN"


def test_rag_audit_fallback_blocks_pediatric_contraindication():
    """Graceful fallback must block pediatric fluoroquinolones as a Tier 1 hard stop."""
    # [AAA] Arrange
    patient = PatientContext(age_years=10, sex="F", is_pregnant=False)
    lines = [PrescriptionLine(drug_name="Ciprofloxacin", duration_days=5)]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", ""):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_CAP_MILD",
            is_outpatient=True,
        )

    # [AAA] Assert
    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"
    assert any(f.rule_id == "TIER1_PEDIATRIC_CONTRAINDICATION" for f in result.flags)


def test_rag_audit_fallback_blocks_documented_allergy():
    """Graceful fallback must block documented penicillin allergy."""
    # [AAA] Arrange
    patient = PatientContext(age_years=40, sex="M", allergies="Severe Penicillin allergy")
    lines = [PrescriptionLine(drug_name="Amoxicillin", duration_days=5)]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", ""):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_CAP_MILD",
            is_outpatient=True,
        )

    # [AAA] Assert
    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"
    assert any(f.rule_id == "TIER1_DRUG_ALLERGY_CONTRAINDICATION" for f in result.flags)


def test_rag_audit_llm_execution_and_parsing():
    """Test successful LLM evaluation with RAG retrieval evidence."""
    # [AAA] Arrange
    patient = PatientContext(age_years=45, sex="F", diagnosis_text="Acute Bronchitis")
    lines = [PrescriptionLine(drug_name="Azithromycin", duration_days=5)]

    mock_llm_response = {
        "status": "FLAGGED",
        "score": 60.0,
        "band": "AMBER",
        "penalties": {"p_class": 0.0, "p_duration": 0.0, "p_indication": 60.0},
        "flags": [
            {
                "tier": 2,
                "rule_id": "RAG_VIRAL_UNINDICATED",
                "rule_name": "Viral Bronchitis Antimicrobial Overprescribing",
                "severity": "HIGH",
                "drug": "Azithromycin",
                "penalty_type": "indication",
                "penalty_score": 60.0,
                "rationale": "Acute bronchitis is predominantly viral. ICMR STG advises against empirical macrolides.",
                "remediation": "Discontinue Azithromycin. Provide symptomatic relief.",
                "citation": "ICMR Standard Treatment Guidelines 2022"
            }
        ],
        "remediation_options": [
            {
                "id": "rem-1",
                "title": "Symptomatic Care Only",
                "description": "Provide steam inhalation and paracetamol.",
                "trade_off": "Avoids selective resistance",
                "first_line_drugs": []
            }
        ]
    }

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    import json
    mock_choice.message.content = json.dumps(mock_llm_response)
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "test-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="Mock ICMR Guidelines: Viral URTI no antibiotics"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_ACUTE_BRONCHITIS",
            is_outpatient=True,
        )


    # [AAA] Assert
    assert result.status == "FLAGGED"
    assert result.score == 60.0
    assert result.band == "AMBER"
    assert len(result.flags) == 1
    assert result.flags[0].rule_id == "RAG_VIRAL_UNINDICATED"


def test_rag_audit_safety_net_overrides_llm_hallucination():
    """If an LLM erroneously approves a lethal contraindication, safety net must force BLOCKED status."""
    # [AAA] Arrange: Pediatric patient with Ciprofloxacin (Hard Stop)
    patient = PatientContext(age_years=8, sex="M")
    lines = [PrescriptionLine(drug_name="Ciprofloxacin", duration_days=5)]

    # Mock an LLM that dangerously approves the prescription
    hallucinated_llm_response = {
        "status": "APPROVED",
        "score": 0.0,
        "band": "GREEN",
        "penalties": {"p_class": 0.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [],
        "remediation_options": []
    }

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    import json
    mock_choice.message.content = json.dumps(hallucinated_llm_response)
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "test-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="Mock guidelines"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_CAP_MILD",
            is_outpatient=True,
        )


    # [AAA] Assert: Safety net must enforce BLOCKED (Score = 100.0, Band = RED)
    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"
    assert any(f.rule_id == "TIER1_PEDIATRIC_CONTRAINDICATION" for f in result.flags)
