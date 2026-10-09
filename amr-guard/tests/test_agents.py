"""
Unit tests for AMR-Guard specialized agents:
- DrugNormalizerAgent (Chain of Responsibility & RapidFuzz matching)
- IndicationAgent (Syndrome resolution & viral self-limiting classification)
- ExtractionAgent (Facade for prescription entity parsing)
"""
import pytest
from app.agents.normalizer import DrugNormalizerAgent, NormalizedDrug
from app.agents.indication import IndicationAgent, SyndromeResolutionResult
from app.agents.extraction import ExtractionAgent
from app.schemas.extract import PrescriptionExtractionResponse


# ===========================================================================
# 1. DrugNormalizerAgent Tests
# ===========================================================================

def test_normalizer_exact_brand_match():
    """Verify exact brand catalog mapping to canonical INN generic and AWaRe tier."""
    agent = DrugNormalizerAgent()
    
    result = agent.normalize("Augmentin 625mg")
    assert result.generic_name == "Amoxicillin-Clavulanate"
    assert result.brand_name == "Augmentin"
    assert result.strength == "625mg"
    assert result.aware_tier == "Access"
    assert result.is_fdc is True

    result2 = agent.normalize("Ciplox 500mg")
    assert result2.generic_name == "Ciprofloxacin"
    assert result2.brand_name == "Ciplox"
    assert result2.strength == "500mg"
    assert result2.aware_tier == "Watch"


def test_normalizer_fuzzy_brand_typos():
    """Verify RapidFuzz phonetic & typo tolerance for miswritten brand names."""
    agent = DrugNormalizerAgent()
    
    # Slight typo in brand name: "Ciploxx" instead of "Ciplox"
    res1 = agent.normalize("Tab Ciploxx 500mg")
    assert res1.generic_name == "Ciprofloxacin"
    assert res1.aware_tier == "Watch"

    # Typo: "Taximm-O" instead of "Taxim-O"
    res2 = agent.normalize("Taximm-O 200mg")
    assert res2.generic_name == "Cefixime"
    assert res2.aware_tier == "Watch"


def test_normalizer_generic_names_and_aware_tiers():
    """Verify generic antimicrobial name normalization across WHO AWaRe tiers."""
    agent = DrugNormalizerAgent()

    # Access tier
    res_access = agent.normalize("Amoxicillin 500 mg cap")
    assert res_access.generic_name == "Amoxicillin"
    assert res_access.aware_tier == "Access"
    assert res_access.strength == "500mg"

    # Watch tier
    res_watch = agent.normalize("Azithromycin 500mg")
    assert res_watch.generic_name == "Azithromycin"
    assert res_watch.aware_tier == "Watch"

    # Reserve tier
    res_reserve = agent.normalize("Meropenem 1g injection")
    assert res_reserve.generic_name == "Meropenem"
    assert res_reserve.aware_tier == "Reserve"
    assert res_reserve.strength == "1g"


def test_normalizer_irrational_fdc_detection():
    """Verify detection of banned/irrational Fixed Dose Combinations."""
    agent = DrugNormalizerAgent()

    res_fdc = agent.normalize("Ofloxacin + Ornidazole 200mg/500mg")
    assert res_fdc.is_fdc is True

    res_tz = agent.normalize("Norflox-TZ")
    assert res_tz.is_fdc is True


# ===========================================================================
# 2. IndicationAgent Tests
# ===========================================================================

def test_indication_exact_canonical_code():
    """Verify direct resolution of canonical ICMR syndrome codes."""
    agent = IndicationAgent()

    res1 = agent.resolve("SYN_CAP_MILD")
    assert res1.canonical_syndrome == "SYN_CAP_MILD"
    assert res1.is_viral_self_limiting is False
    assert res1.source == "exact_code"

    res2 = agent.resolve("SYN_COMMON_COLD")
    assert res2.canonical_syndrome == "SYN_COMMON_COLD"
    assert res2.is_viral_self_limiting is True


def test_indication_clinical_keyword_mapping():
    """Verify mapping of clinical symptoms and doctor notes to ICMR syndromes."""
    agent = IndicationAgent()

    # UTI
    res_uti = agent.resolve("Patient complains of dysuria and burning micturition")
    assert res_uti.canonical_syndrome == "SYN_UNCOMPLICATED_UTI"
    assert res_uti.is_viral_self_limiting is False

    # Pneumonia / CAP
    res_cap = agent.resolve("Fever, productive cough with rust-colored sputum, suspected pneumonia")
    assert res_cap.canonical_syndrome == "SYN_CAP_MILD"
    assert res_cap.is_viral_self_limiting is False

    # Viral URTI
    res_urti = agent.resolve("Viral infection, runny nose, sneezing, mild fever")
    assert res_urti.is_viral_self_limiting is True

    # Acute Watery Diarrhea
    res_diarrhea = agent.resolve("Frequent loose watery stools since yesterday")
    assert res_diarrhea.canonical_syndrome == "SYN_WATERY_DIARRHEA"
    assert res_diarrhea.is_viral_self_limiting is True


def test_indication_empty_and_fallback():
    """Verify graceful fallback for empty or novel clinical diagnoses."""
    agent = IndicationAgent()

    res_empty = agent.resolve("")
    assert res_empty.canonical_syndrome is None
    assert res_empty.confidence == 0.0

    res_unspec = agent.resolve("Post-operative elective monitoring")
    assert res_unspec.canonical_syndrome is None
    assert res_unspec.is_viral_self_limiting is False


# ===========================================================================
# 3. ExtractionAgent Tests
# ===========================================================================

def test_extraction_agent_heuristic_fallback():
    """Verify ExtractionAgent offline heuristic parsing with normalizer integration."""
    agent = ExtractionAgent()

    text = "Rx: Tab Ciplox 500mg for 5 days. Patient: 42yo female, non-pregnant. Diagnosis: Acute Cystitis / Lower UTI."
    result = agent.fallback_heuristic_extract(text)

    assert isinstance(result, PrescriptionExtractionResponse)
    assert result.patient.age_years == 42
    assert result.patient.sex == "F"
    assert result.patient.is_pregnant is False
    assert result.canonical_syndrome == "SYN_UNCOMPLICATED_UTI"
    assert len(result.prescription_lines) >= 1

    extracted_drug = result.prescription_lines[0]
    assert "Ciprofloxacin" in extracted_drug.drug_name or "Ciprofloxacin" in extracted_drug.generic
    assert extracted_drug.aware_tier == "Watch"


def test_extraction_agent_image_fallback():
    """Verify image extraction fallback behaves deterministically when offline."""
    agent = ExtractionAgent()
    mock_bytes = b"fake-jpeg-bytes"

    result = agent.extract_from_image(mock_bytes, "image/jpeg")
    assert isinstance(result, PrescriptionExtractionResponse)
    assert result.patient.age_years == 32
    assert len(result.prescription_lines) >= 1
    assert result.prescription_lines[0].drug_name == "Amoxicillin"
