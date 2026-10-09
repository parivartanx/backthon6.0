import pytest
from app.agents.normalizer import DrugNormalizerAgent

def test_normalizer_populates_safety_attributes_for_vancomycin():
    agent = DrugNormalizerAgent()
    result = agent.normalize("Vancocin 1g IV")
    assert result.generic_name.lower() == "vancomycin"
    assert result.is_nephrotoxic is True, "Vancomycin must be marked nephrotoxic"
    assert result.requires_egfr is True, "Vancomycin must require eGFR"
    assert result.outpatient_iv_restricted is True, "Vancomycin must have outpatient IV restriction"
    assert result.aware_tier in ["Watch", "Reserve"]

def test_normalizer_dynamic_classification_for_unseen_drug():
    agent = DrugNormalizerAgent()
    # Test novel aminoglycoside or glycopeptide
    result = agent.normalize("Teicoplanin 400mg")
    assert result.is_nephrotoxic is True
    assert result.requires_egfr is True
