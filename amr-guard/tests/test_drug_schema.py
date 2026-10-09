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
