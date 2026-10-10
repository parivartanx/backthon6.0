"""
Unit tests for drug normalizers and ontological constraint helpers in AMR-Guard.
"""
from app.engine.constraints import (
    normalize_text,
    is_fluoroquinolone,
    is_tetracycline,
    is_aminoglycoside,
    get_aware_tier,
    is_irrational_fdc,
    is_antibiotic_drug,
    is_nsaid_drug,
)

def test_normalize_text():
    assert normalize_text("  Ciprofloxacin 500mg  ") == "ciprofloxacin 500mg"
    assert normalize_text(None) == ""

def test_fluoroquinolone_detection():
    assert is_fluoroquinolone("Ciprofloxacin") is True
    assert is_fluoroquinolone("Levofloxacin 500mg") is True
    assert is_fluoroquinolone("Norflox-TZ") is True
    assert is_fluoroquinolone("Amoxicillin") is False

def test_tetracycline_detection():
    assert is_tetracycline("Doxycycline 100mg") is True
    assert is_tetracycline("Minocycline") is True
    assert is_tetracycline("Azithromycin") is False

def test_aminoglycoside_detection():
    assert is_aminoglycoside("Amikacin 500mg inj") is True
    assert is_aminoglycoside("Gentamicin") is True
    assert is_aminoglycoside("Cefixime") is False

def test_aware_tier_mapping():
    assert get_aware_tier("Amoxicillin") == "Access"
    assert get_aware_tier("Nitrofurantoin") == "Access"
    assert get_aware_tier("Cefixime") == "Watch"
    assert get_aware_tier("Azithromycin") == "Watch"
    assert get_aware_tier("Meropenem") == "Reserve"
    assert get_aware_tier("Colistin") == "Reserve"

def test_non_antibiotic_aware_tier_mapping():
    # [TDD: RED] Non-antimicrobials must NOT have AWaRe tiers (Access/Watch/Reserve/Unknown)
    assert is_nsaid_drug("Diclofenac 50 mg") is True
    assert is_antibiotic_drug("Diclofenac 50 mg") is False
    assert is_antibiotic_drug("Paracetamol") is False
    assert get_aware_tier("Diclofenac 50 mg") == "Not Applicable"
    assert get_aware_tier("Paracetamol") == "Not Applicable"

def test_irrational_fdc_detection():
    assert is_irrational_fdc("Ofloxacin + Ornidazole") is True
    assert is_irrational_fdc("Ofloxacin / Ornidazole") is True
    assert is_irrational_fdc("Cefixime + Azithromycin") is True
    assert is_irrational_fdc("Amoxicillin") is False
