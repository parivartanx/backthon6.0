"""
Comprehensive Evaluation Test Suite for RAG-First Prescription Audit Agent.

Evaluates the Hybrid RAG + LLM architecture across 9 critical dimensions:
1. RAG Evidence Retrieval & Context Injection
2. LLM Remediation Option Extraction & Normalization
3. API Connection Failure & Timeout Graceful Fallback
4. Corrupted / Malformed LLM Output Resilience
5. Fatal Comorbidity Black-Box Safeguard (Myasthenia Gravis)
6. Fatal Hemolytic Anemia Safeguard (G6PD Deficiency)
7. Outpatient Reserve Group Air-Gap Enforcement
8. Irrational Fixed-Dose Combination (FDC) Detection
9. Execution Latency Telemetry & SLA Profiling

Adheres strictly to testing-agent guidelines with AAA structure and GoF annotations.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from openai import APITimeoutError

from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.audit import AuditResult, RuleViolation
from app.agents.rag_audit import audit_prescription_rag_first


# ===========================================================================
# 1. RAG Retrieval & Evidence Grounding Evaluation
# ===========================================================================

def test_rag_audit_retrieval_context_passed_to_llm():
    """
    [HAPPY PATH] [MOCK]
    Verify that Hybrid RAG searches clinical guidelines, monographs,
    and pathogen resistance, injecting them into the LLM context.
    """
    # [AAA] Arrange
    patient = PatientContext(
        age_years=29,
        sex="F",
        diagnosis_text="Acute Cystitis",
        allergies="NKDA",
        medical_history="None",
    )
    lines = [PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)]

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "status": "APPROVED",
        "score": 0.0,
        "band": "GREEN",
        "penalties": {"p_class": 0.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [],
        "remediation_options": []
    })
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    mock_search = MagicMock(return_value="ICMR STG: Nitrofurantoin 100mg BD 5 days is first-line.")
    mock_monograph = MagicMock(return_value='{"drug_name": "Nitrofurantoin", "aware_tier": "Access"}')
    mock_resistance = MagicMock(return_value="E. coli Nitrofurantoin susceptibility >85%.")

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", mock_search), \
         patch("app.agents.rag_audit.get_drug_monograph", mock_monograph), \
         patch("app.agents.rag_audit.get_pathogen_resistance_data", mock_resistance), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_UNCOMPLICATED_UTI",
            is_outpatient=True,
        )

    # [AAA] Assert
    assert mock_search.called
    assert mock_monograph.called
    assert mock_resistance.called
    assert result.status == "APPROVED"
    assert result.score == 0.0

    # Verify that the LLM call received the RAG context in the user prompt
    call_args = mock_openai_client.chat.completions.create.call_args[1]
    user_prompt = call_args["messages"][1]["content"]
    assert "Nitrofurantoin" in user_prompt
    assert "ICMR STG" in user_prompt
    assert "susceptibility >85%" in user_prompt


# ===========================================================================
# 2. Remediation Generation & Schema Normalization Evaluation
# ===========================================================================

def test_rag_audit_remediation_options_generation():
    """
    [HAPPY PATH] [MOCK]
    Verify that LLM-generated de-escalation remediation options are normalized
    and returned in the standard RemediationOption schema.
    """
    # [AAA] Arrange
    patient = PatientContext(age_years=40, sex="M", diagnosis_text="Community Acquired Pneumonia")
    lines = [PrescriptionLine(drug_name="Meropenem", duration_days=7)]

    llm_payload = {
        "status": "FLAGGED",
        "score": 45.0,
        "band": "AMBER",
        "penalties": {"p_class": 85.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [
            {
                "tier": 3,
                "rule_id": "TIER3_AWARE_RESERVE_AIRGAP",
                "rule_name": "Reserve-Group Outpatient Air-Gap",
                "severity": "HIGH",
                "drug": "Meropenem",
                "penalty_type": "class",
                "penalty_score": 85.0,
                "rationale": "Empirical Meropenem without culture confirmation violates stewardship.",
                "remediation": "De-escalate to oral Amoxicillin-Clavulanate.",
                "citation": "WHO AWaRe Classification 2023"
            }
        ],
        "remediation_options": [
            {
                "recommendation_type": "SWITCH_DRUG",
                "suggested_drug": "Amoxicillin-Clavulanate",
                "suggested_duration_days": 5,
                "guidance": "De-escalate from Reserve carbapenem to standard Access first-line oral therapy.",
                "source_citation": "ICMR STG Respiratory 2022"
            }
        ]
    }

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(llm_payload)
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="ICMR STG CAP Guidelines"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_CAP_MILD",
            has_culture_report=False,
            is_outpatient=True,
        )

    # [AAA] Assert
    assert result.status == "FLAGGED"
    assert len(result.remediation_options) == 1
    rem = result.remediation_options[0]
    assert rem.recommendation_type == "SWITCH_DRUG"
    assert rem.suggested_drug == "Amoxicillin-Clavulanate"
    assert rem.suggested_duration_days == 5
    assert "De-escalate" in rem.guidance


# ===========================================================================
# 3. Network & System Resilience Evaluation (Fallback Modes)
# ===========================================================================

def test_rag_audit_api_timeout_fallback():
    """
    [SAD PATH] [MOCK]
    Verify that an OpenAI/OpenRouter network timeout automatically triggers
    a seamless fallback to the local deterministic verification core.
    """
    # [AAA] Arrange
    patient = PatientContext(age_years=25, sex="F", is_pregnant=True)
    lines = [PrescriptionLine(drug_name="Doxycycline", duration_days=7)]

    mock_openai_client = MagicMock()
    # Simulate API timeout
    mock_openai_client.chat.completions.create.side_effect = APITimeoutError(request=MagicMock())

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="Guidelines text"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_CAP_MILD",
            is_outpatient=True,
        )

    # [AAA] Assert
    # Graceful fallback must identify the pregnancy contraindication deterministically
    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"
    assert any(f.rule_id == "TIER1_PREGNANCY_GATE" for f in result.flags)


def test_rag_audit_malformed_llm_json_fallback():
    """
    [SAD PATH] [MOCK]
    Verify that malformed or truncated JSON from the LLM triggers safe fallback
    to deterministic verification without raising an unhandled exception.
    """
    # [AAA] Arrange
    patient = PatientContext(age_years=70, sex="M", egfr=22.0)
    lines = [PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)]

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "CORRUPTED_JSON_NOT_VALID_SYNTAX{{{"
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="Guidelines text"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_UNCOMPLICATED_UTI",
            is_outpatient=True,
        )

    # [AAA] Assert
    # Fallback must execute and catch the geriatric/renal contraindication
    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"
    assert any(f.rule_id == "TIER1_NITROFURANTOIN_RENAL_AGE" for f in result.flags)


# ===========================================================================
# 4. Comorbidity & Safety Net Override Evaluation
# ===========================================================================

def test_rag_audit_myasthenia_gravis_comorbidity_blocked():
    """
    [BOUNDARY] [MOCK]
    Myasthenia Gravis patient prescribed Ciprofloxacin:
    Even if LLM fails to recognize the risk, the safety net must guarantee BLOCKED status.
    """
    # [AAA] Arrange
    patient = PatientContext(
        age_years=52,
        sex="M",
        medical_history="Diagnosed with Myasthenia Gravis under neurological care",
    )
    lines = [PrescriptionLine(drug_name="Ciprofloxacin", duration_days=5)]

    hallucinated_response = {
        "status": "APPROVED",
        "score": 0.0,
        "band": "GREEN",
        "penalties": {"p_class": 0.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [],
        "remediation_options": []
    }

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(hallucinated_response)
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="Mock guidelines"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_UNCOMPLICATED_UTI",
            is_outpatient=True,
        )

    # [AAA] Assert
    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"


def test_rag_audit_g6pd_deficiency_comorbidity_blocked():
    """
    [BOUNDARY] [MOCK]
    G6PD Deficiency patient prescribed Nitrofurantoin:
    Safety net must guarantee BLOCKED status for acute hemolysis risk.
    """
    # [AAA] Arrange
    patient = PatientContext(
        age_years=31,
        sex="M",
        medical_history="Documented G6PD Deficiency",
    )
    lines = [PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)]

    hallucinated_response = {
        "status": "APPROVED",
        "score": 0.0,
        "band": "GREEN",
        "penalties": {"p_class": 0.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [],
        "remediation_options": []
    }

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(hallucinated_response)
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="Mock guidelines"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_UNCOMPLICATED_UTI",
            is_outpatient=True,
        )

    # [AAA] Assert
    assert result.status == "BLOCKED"
    assert result.score == 100.0
    assert result.band == "RED"


# ===========================================================================
# 5. AWaRe Policy & Regulatory Violations Evaluation
# ===========================================================================

def test_rag_audit_outpatient_reserve_drug_airgap_flagged():
    """
    [HAPPY PATH] [MOCK]
    Outpatient prescribed Linezolid without positive microbiology must be flagged
    with Reserve group class penalty.
    """
    # [AAA] Arrange
    patient = PatientContext(age_years=38, sex="M")
    lines = [PrescriptionLine(drug_name="Linezolid", duration_days=5)]

    llm_payload = {
        "status": "FLAGGED",
        "score": 34.0,
        "band": "GREEN",
        "penalties": {"p_class": 85.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [
            {
                "tier": 3,
                "rule_id": "TIER3_AWARE_RESERVE_AIRGAP",
                "rule_name": "Reserve-Group Outpatient Air-Gap Gate",
                "severity": "HIGH",
                "drug": "Linezolid",
                "penalty_type": "class",
                "penalty_score": 85.0,
                "rationale": "Empirical outpatient Reserve prescribing without microbiology report.",
                "remediation": "Requires ID specialist sign-off and culture confirmation.",
                "citation": "WHO AWaRe Reserve Stewardship"
            }
        ],
        "remediation_options": []
    }

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(llm_payload)
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="Reserve antibiotic guidelines"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_SSTI_UNCOMPLICATED",
            has_positive_microbiology=False,
            is_outpatient=True,
        )

    # [AAA] Assert
    assert result.status == "FLAGGED"
    assert result.penalties.p_class >= 85.0
    assert any("RESERVE" in f.rule_id for f in result.flags)


def test_rag_audit_banned_fdc_detection():
    """
    [HAPPY PATH] [MOCK]
    Prescription containing irrational dual-antimicrobial FDC (Ofloxacin + Ornidazole)
    must trigger an irrational FDC flag.
    """
    # [AAA] Arrange
    patient = PatientContext(age_years=44, sex="F")
    lines = [PrescriptionLine(drug_name="Ofloxacin + Ornidazole", is_fdc=True, duration_days=5)]

    llm_payload = {
        "status": "FLAGGED",
        "score": 40.0,
        "band": "AMBER",
        "penalties": {"p_class": 0.0, "p_duration": 0.0, "p_indication": 0.0},
        "flags": [
            {
                "tier": 2,
                "rule_id": "TIER2_UNAPPROVED_FDC",
                "rule_name": "Unapproved Irrational FDC Gate",
                "severity": "HIGH",
                "drug": "Ofloxacin + Ornidazole",
                "penalty_type": "fdc",
                "penalty_score": 40.0,
                "rationale": "Irrational dual antimicrobial combination banned under Gazette notifications.",
                "remediation": "Switch to single active agent tailored to suspected pathogen.",
                "citation": "CDSCO Banned FDCs Gazette"
            }
        ],
        "remediation_options": []
    }

    mock_openai_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(llm_payload)
    mock_openai_client.chat.completions.create.return_value.choices = [mock_choice]

    # [AAA] Act
    with patch("app.agents.rag_audit.settings.OPENROUTER_API_KEY", "mock-key"), \
         patch("app.agents.rag_audit.search_amr_guidelines", return_value="CDSCO Banned FDCs"), \
         patch("app.agents.rag_audit.OpenAI", return_value=mock_openai_client):
        result = audit_prescription_rag_first(
            patient=patient,
            prescription_lines=lines,
            canonical_syndrome="SYN_WATERY_DIARRHEA",
            is_outpatient=True,
        )

    # [AAA] Assert
    assert result.status == "FLAGGED"
    assert any("FDC" in f.rule_id for f in result.flags)


# ===========================================================================
# 6. Telemetry & Execution Latency Evaluation
# ===========================================================================

def test_rag_audit_latency_telemetry_recorded():
    """
    [HAPPY PATH]
    Verify that latency_ms is accurately profiled and populated in AuditResult.
    """
    # [AAA] Arrange
    patient = PatientContext(age_years=33, sex="M")
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
    assert isinstance(result.latency_ms, int)
    assert result.latency_ms >= 0
