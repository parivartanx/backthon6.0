"""
Ontological constraints, drug classifications, and standard treatment guideline
constants for AMR-Guard deterministic verification pipeline.
"""
from typing import Optional, Set, Tuple

# ---------------------------------------------------------------------------
# Tier 1: Contraindication Constants
# ---------------------------------------------------------------------------

PEDIATRIC_FLUOROQUINOLONES: Set[str] = {
    "ciprofloxacin",
    "levofloxacin",
    "ofloxacin",
    "norfloxacin",
    "moxifloxacin",
    "gemifloxacin",
    "pefloxacin",
    "lomefloxacin",
    "sparfloxacin",
    "norflox",
    "ciproflox",
    "levoflox",
    "oflox",
    "moxiflox",
}

PEDIATRIC_TETRACYCLINES: Set[str] = {
    "doxycycline",
    "tetracycline",
    "minocycline",
    "oxytetracycline",
    "demeclocycline",
}

PREGNANCY_CONTRAINDICATED_DRUGS: Set[str] = {
    "doxycycline",
    "tetracycline",
    "minocycline",
    "ciprofloxacin",
    "levofloxacin",
    "ofloxacin",
    "norfloxacin",
    "moxifloxacin",
    "amikacin",
    "gentamicin",
    "tobramycin",
    "streptomycin",
    "kanamycin",
    "clarithromycin",
}

# ---------------------------------------------------------------------------
# Tier 2: Viral / Self-Limiting Syndromes & Irrational FDCs
# ---------------------------------------------------------------------------

VIRAL_SELF_LIMITING_SYNDROMES: Set[str] = {
    "acute bronchitis",
    "common cold",
    "viral urti",
    "pharyngitis without strep criteria",
    "acute watery diarrhea",
    "syn_acute_bronchitis",
    "syn_common_cold",
    "syn_viral_urti",
    "syn_pharyngitis_non_strep",
    "syn_watery_diarrhea",
}

IRRATIONAL_FDC_PAIRS: list[tuple[str, str]] = [
    ("ofloxacin", "ornidazole"),
    ("cefixime", "azithromycin"),
    ("ciprofloxacin", "tinidazole"),
    ("norfloxacin", "tinidazole"),
    ("norfloxacin", "metronidazole"),
    ("metronidazole", "ofloxacin"),
    ("cefpodoxime", "azithromycin"),
    ("amoxicillin", "bromhexine"),
]

# ---------------------------------------------------------------------------
# Tier 3: WHO AWaRe Classification Registry
# ---------------------------------------------------------------------------

AWARE_ACCESS_DRUGS: Set[str] = {
    "amoxicillin",
    "amoxicillin + clavulanic acid",
    "amoxicillin-clavulanate",
    "amox-clav",
    "ampicillin",
    "benzathine benzylpenicillin",
    "benzylpenicillin",
    "cefalexin",
    "cephalexin",
    "cefazolin",
    "chloramphenicol",
    "clindamycin",
    "cloxacillin",
    "doxycycline",
    "gentamicin",
    "metronidazole",
    "nitrofurantoin",
    "phenoxymethylpenicillin",
    "penicillin v",
    "co-trimoxazole",
    "trimethoprim + sulfamethoxazole",
    "cotrimoxazole",
    "sulfamethoxazole-trimethoprim",
    "trimethoprim",
    "fosfomycin",  # oral sachet for uncomplicated UTI
}

AWARE_WATCH_DRUGS: Set[str] = {
    "azithromycin",
    "cefaclor",
    "cefepime",
    "cefixime",
    "cefotaxime",
    "cefpodoxime",
    "ceftaroline",
    "ceftazidime",
    "ceftriaxone",
    "cefuroxime",
    "ciprofloxacin",
    "clarithromycin",
    "erythromycin",
    "levofloxacin",
    "moxifloxacin",
    "norfloxacin",
    "ofloxacin",
    "piperacillin + tazobactam",
    "piperacillin-tazobactam",
    "teicoplanin",
    "vancomycin",
}

AWARE_RESERVE_DRUGS: Set[str] = {
    "cefiderocol",
    "ceftazidime + avibactam",
    "ceftolozane + tazobactam",
    "colistin",
    "fosfomycin iv",
    "linezolid",
    "meropenem",
    "imipenem",
    "ertapenem",
    "polymyxin b",
    "tigecycline",
    "plazomicin",
}

# Syndromes that have established Access first-line alternatives
SYNDROMES_WITH_ACCESS_FIRST_LINE = {
    "syn_cap_mild": "Amoxicillin (500mg TID for 5 days)",
    "cap mild": "Amoxicillin (500mg TID for 5 days)",
    "community-acquired pneumonia (mild)": "Amoxicillin (500mg TID for 5 days)",
    "syn_uncomplicated_uti": "Nitrofurantoin (100mg BD for 5 days) or Fosfomycin (3g single sachet)",
    "uncomplicated lower uti": "Nitrofurantoin (100mg BD for 5 days) or Fosfomycin (3g single sachet)",
    "cystitis": "Nitrofurantoin (100mg BD for 5 days) or Fosfomycin (3g single sachet)",
    "syn_pharyngitis_strep": "Penicillin V or Amoxicillin",
    "strep pharyngitis": "Penicillin V or Amoxicillin",
    "syn_aom": "Amoxicillin",
    "acute otitis media": "Amoxicillin",
    "skin and soft tissue infection": "Cloxacillin or Cefalexin",
}

# ---------------------------------------------------------------------------
# Helper Normalization Functions
# ---------------------------------------------------------------------------

def normalize_text(text: Optional[str]) -> str:
    """Lowercase and strip whitespace for robust matching."""
    if not text:
        return ""
    return text.strip().lower()

def is_fluoroquinolone(drug_name: str) -> bool:
    """Check if drug is a fluoroquinolone."""
    norm = normalize_text(drug_name)
    return any(fq in norm for fq in PEDIATRIC_FLUOROQUINOLONES)

def is_tetracycline(drug_name: str) -> bool:
    """Check if drug is a tetracycline."""
    norm = normalize_text(drug_name)
    return any(tc in norm for tc in PEDIATRIC_TETRACYCLINES)

def is_aminoglycoside(drug_name: str) -> bool:
    """Check if drug is an aminoglycoside."""
    norm = normalize_text(drug_name)
    aminos = {"amikacin", "gentamicin", "tobramycin", "streptomycin", "kanamycin"}
    return any(am in norm for am in aminos)

def get_aware_tier(drug_name: str, fallback_tier: Optional[str] = None) -> str:
    """Determine the WHO AWaRe classification tier."""
    if fallback_tier and fallback_tier.capitalize() in {"Access", "Watch", "Reserve"}:
        return fallback_tier.capitalize()

    norm = normalize_text(drug_name)

    # Check Reserve first
    for r in AWARE_RESERVE_DRUGS:
        if r in norm:
            return "Reserve"

    # Check Watch
    for w in AWARE_WATCH_DRUGS:
        if w in norm:
            return "Watch"

    # Check Access
    for a in AWARE_ACCESS_DRUGS:
        if a in norm:
            return "Access"

    return "Unknown"

def is_irrational_fdc(drug_name: str) -> bool:
    """Check if the formulation matches an irrational fixed-dose combination."""
    norm = normalize_text(drug_name)
    for part1, part2 in IRRATIONAL_FDC_PAIRS:
        if part1 in norm and part2 in norm:
            return True
    return False
