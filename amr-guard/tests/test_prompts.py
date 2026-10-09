"""
Unit tests for the AMR-Guard prompt management architecture (app.agents.prompts).
Tests Template Method, Strategy, Builder, and Factory patterns offline with zero API calls.
"""
import json
import pytest
from pydantic import BaseModel, Field
from typing import List, Optional

from app.agents.prompts import (
    BasePromptStrategy,
    VerificationPromptStrategy,
    RemediationPromptStrategy,
    SynthesisPromptStrategy,
    ExtractionPromptStrategy,
    IngestionPromptStrategy,
    IndicationPromptStrategy,
    NormalizerPromptStrategy,
    PromptBuilder,
    PromptFactory,
)
from app.schemas.orchestrator import ContextBundle
from app.schemas.remediation import RemediationResponse
from app.schemas.extract import PrescriptionExtractionResponse
from app.schemas.ingestion import IngestionResult


class MockClinicalSchema(BaseModel):
    decision: str = Field(description="Safety decision")
    confidence: float = Field(description="Confidence score 0.0-1.0")


def test_base_prompt_strategy_template_method():
    """Verify that BasePromptStrategy executes the invariant message formatting algorithm."""
    class DummyStrategy(BasePromptStrategy):
        def system_instructions(self) -> str:
            return "System Persona"
        def user_content(self) -> str:
            return "User Payload"

    strategy = DummyStrategy()
    messages = strategy.build_messages()

    assert len(messages) == 2
    assert messages[0] == {"role": "system", "content": "System Persona"}
    assert messages[1] == {"role": "user", "content": "User Payload"}


def test_verification_prompt_strategy():
    """Test VerificationPromptStrategy outputs and dynamic context injection."""
    scenario = "65yo female with acute cystitis prescribed Ciprofloxacin 500mg BID."
    guidelines = ["ICMR STG: Avoid Cipro for uncomplicated cystitis."]
    resistance = {"E. coli FQ resistance": ">75%"}

    strategy = VerificationPromptStrategy(
        clinical_scenario=scenario,
        guidelines_context=guidelines,
        resistance_stats=resistance,
    )
    messages = strategy.build_messages()

    assert len(messages) == 2
    assert "AMR Verification Agent" in messages[0]["content"]
    assert "ICMR STG" in messages[0]["content"]
    assert ">75%" in messages[0]["content"]
    assert scenario in messages[1]["content"]


def test_remediation_prompt_strategy():
    """Test RemediationPromptStrategy creates appropriate clinical de-escalation directives."""
    strategy = RemediationPromptStrategy(
        syndrome="SYN_UNCOMPLICATED_UTI",
        flagged_drug="Ciprofloxacin",
        patient_profile="Age: 28, Pregnant: False, eGFR: Normal",
        guideline_summaries=["Nitrofurantoin 100mg BID 5d is first-line."],
    )
    messages = strategy.build_messages()

    assert len(messages) == 2
    assert "Antimicrobial Stewardship Remediation Agent" in messages[0]["content"]
    assert "Nitrofurantoin" in messages[0]["content"]
    assert "SYN_UNCOMPLICATED_UTI" in messages[1]["content"]
    assert "Ciprofloxacin" in messages[1]["content"]


def test_synthesis_prompt_schema_injection():
    """Test SynthesisPromptStrategy injects valid Pydantic JSON schema."""
    strategy = SynthesisPromptStrategy(
        clinical_query="Evaluate Amoxicillin 500mg for Viral Pharyngitis",
        target_schema=ContextBundle,
    )
    messages = strategy.build_messages()

    assert len(messages) == 2
    assert "AMR-Guard clinical synthesizer" in messages[0]["content"]
    user_msg = messages[1]["content"]
    assert "ContextBundle" in user_msg or "is_safe" in user_msg
    # Verify that the schema is valid JSON
    schema_dump = ContextBundle.model_json_schema()
    assert "properties" in schema_dump


def test_extraction_prompt_strategy_schema_lockstep():
    """Test ExtractionPromptStrategy stays in lockstep with PrescriptionExtractionResponse schema."""
    strategy = ExtractionPromptStrategy(target_schema=PrescriptionExtractionResponse)
    sys_inst = strategy.system_instructions()

    assert "PrescriptionExtractionResponse" in sys_inst or "prescription_lines" in sys_inst
    assert "patient" in sys_inst
    assert "canonical_syndrome" in sys_inst


def test_ingestion_prompt_strategy():
    """Test IngestionPromptStrategy correctly renders OKF normalizer prompt."""
    strategy = IngestionPromptStrategy(
        raw_content="Drug,Dose\nAmox,500mg",
        data_type="regimens",
        target_schema=IngestionResult,
    )
    messages = strategy.build_messages()

    assert len(messages) == 2
    assert "data extraction assistant" in messages[0]["content"]
    assert "regimens" in messages[1]["content"]
    assert "Amox,500mg" in messages[1]["content"]


def test_fluent_prompt_builder():
    """Test step-by-step composition with PromptBuilder."""
    builder = (
        PromptBuilder()
        .with_role("You are an AMR Pediatric Specialist.")
        .with_guideline_constraints([
            "Contraindicated: Fluoroquinolones under 18 years",
            "Contraindicated: Tetracyclines under 8 years",
        ])
        .with_schema(MockClinicalSchema)
        .with_query("Check prescription for 6yo child: Ciprofloxacin 250mg.")
    )
    messages = builder.build()

    assert len(messages) == 2
    system_content = messages[0]["content"]
    user_content = messages[1]["content"]

    assert "AMR Pediatric Specialist" in system_content
    assert "Fluoroquinolones under 18 years" in system_content
    assert "MockClinicalSchema" in system_content or "decision" in system_content
    assert "6yo child" in user_content


def test_prompt_factory_all_methods():
    """Test that PromptFactory accurately instantiates all strategies."""
    p1 = PromptFactory.create_verification_prompt("Clinical test scenario")
    assert isinstance(p1, VerificationPromptStrategy)

    p2 = PromptFactory.create_remediation_prompt("CAP", "Azithromycin", "Adult 45yo")
    assert isinstance(p2, RemediationPromptStrategy)

    p3 = PromptFactory.create_synthesis_prompt("Query", RemediationResponse)
    assert isinstance(p3, SynthesisPromptStrategy)

    p4 = PromptFactory.create_extraction_prompt(PrescriptionExtractionResponse)
    assert isinstance(p4, ExtractionPromptStrategy)

    p5 = PromptFactory.create_ingestion_prompt("CSV", "drugs", IngestionResult)
    assert isinstance(p5, IngestionPromptStrategy)

    p6 = PromptFactory.create_indication_prompt("Patient has severe dysuria")
    assert isinstance(p6, IndicationPromptStrategy)

    p7 = PromptFactory.create_normalizer_prompt("Augmentin 625mg")
    assert isinstance(p7, NormalizerPromptStrategy)


def test_indication_prompt_strategy():
    """Test IndicationPromptStrategy message assembly."""
    strategy = PromptFactory.create_indication_prompt(
        diagnosis_text="Sore throat and runny nose for 2 days"
    )
    messages = strategy.build_messages()
    assert len(messages) == 2
    assert "AMR-Guard clinical diagnosis normalization" in messages[0]["content"]
    assert "SYN_VIRAL_URTI" in messages[0]["content"]
    assert "Sore throat" in messages[1]["content"]


def test_normalizer_prompt_strategy():
    """Test NormalizerPromptStrategy message assembly."""
    strategy = PromptFactory.create_normalizer_prompt(
        raw_drug_string="Tab Ciplox 500mg BID",
        reference_generics=["Ciprofloxacin", "Ofloxacin"]
    )
    messages = strategy.build_messages()
    assert len(messages) == 2
    assert "clinical pharmacologist" in messages[0]["content"]
    assert "Ciprofloxacin" in messages[0]["content"]
    assert "Tab Ciplox 500mg" in messages[1]["content"]
