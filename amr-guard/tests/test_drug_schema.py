import pytest
from app.db.models import Drug
from app.db.session import SessionLocal

def test_vancomycin_has_nephrotoxicity_and_egfr_attributes():
    """Verify that Vancomycin in the database formulary has explicit safety flags."""
    db = SessionLocal()
    try:
        drug = db.query(Drug).filter(Drug.generic_name.ilike("Vancomycin")).first()
        assert drug is not None, "Vancomycin must exist in the drug database"
        assert drug.is_nephrotoxic is True, "Vancomycin must be marked as nephrotoxic"
        assert drug.requires_egfr is True, "Vancomycin must require baseline eGFR"
        assert drug.requires_tdm is True, "Vancomycin must require therapeutic drug monitoring"
        assert drug.outpatient_iv_restricted is True, "Vancomycin IV must be restricted in outpatient settings"
        assert drug.aware_class in ["Watch", "Reserve"], "Vancomycin must be Watch or Reserve, not Access"
    finally:
        db.close()


def test_drugs_have_usage_and_side_effects_seeded():
    """Verify that antimicrobial drugs have FDA usage and side effects/warnings populated in DB."""
    # [AAA] Arrange
    db = SessionLocal()
    try:
        # [AAA] Act
        cipro = db.query(Drug).filter(Drug.generic_name.ilike("Ciprofloxacin")).first()
        amox = db.query(Drug).filter(Drug.generic_name.ilike("Amoxicillin")).first()
        dapto = db.query(Drug).filter(Drug.generic_name.ilike("Daptomycin")).first()

        # [AAA] Assert
        assert cipro is not None
        assert cipro.usage is not None and len(cipro.usage) > 10
        assert cipro.side_effects is not None and "tendon" in cipro.side_effects.lower()
        assert "myasthenia" in cipro.side_effects.lower()

        assert amox is not None
        assert amox.usage is not None and len(amox.usage) > 10
        assert amox.side_effects is not None and len(amox.side_effects) > 10

        assert dapto is not None
        assert "not indicated for pneumonia" in dapto.usage.lower()
        assert "muscle" in dapto.side_effects.lower() or "rhabdomyolysis" in dapto.side_effects.lower()
    finally:
        db.close()


def test_monograph_includes_fda_usage_and_side_effects():
    """Verify that get_drug_monograph tool returns FDA usage and side effects in clinical JSON."""
    # [AAA] Arrange
    import json
    from app.agents.tools import get_drug_monograph

    # [AAA] Act
    mono_json = get_drug_monograph("Ciprofloxacin")
    profile = json.loads(mono_json)

    # [AAA] Assert
    assert profile["drug_name"] == "Ciprofloxacin"
    assert "fda_approved_usage" in profile
    assert "fda_side_effects_and_warnings" in profile
    assert "tendon" in profile["fda_side_effects_and_warnings"].lower()
    assert "myasthenia" in profile["fda_side_effects_and_warnings"].lower()


def test_normalizer_enriches_usage_and_side_effects():
    """Verify DrugNormalizerAgent populates FDA usage and side-effects from formulary DB."""
    # [AAA] Arrange
    from app.agents.normalizer import DrugNormalizerAgent
    normalizer = DrugNormalizerAgent()

    # [AAA] Act
    res = normalizer.normalize("Cifran 500 mg")

    # [AAA] Assert
    assert res.generic_name == "Ciprofloxacin"
    assert res.usage is not None and len(res.usage) > 10
    assert res.side_effects is not None and "tendon" in res.side_effects.lower()
